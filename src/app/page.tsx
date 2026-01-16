'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Filter, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { ProjectCard } from '@/components/ProjectCard';
import { SessionCard } from '@/components/SessionCard';
import { AddProjectModal } from '@/components/AddProjectModal';
import { useSounds } from '@/components/SoundProvider';
import { PROJECT_COLORS } from '@/lib/constants';

interface Project {
  id: string;
  name: string;
  path: string;
  color: string;
  defaultTerminals: number;
}

interface Session {
  session_id: string;
  first_message: number;
  last_message: number;
  message_count: number;
  cwd: string;
  summary: string | null;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projectPaths, setProjectPaths] = useState<string[]>([]);
  const [filterPath, setFilterPath] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { play } = useSounds();

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, []);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const url = filterPath
        ? `/api/sessions?project=${encodeURIComponent(filterPath)}`
        : '/api/sessions';
      const response = await fetch(url);
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  }, [filterPath]);

  // Fetch project paths for filter
  const fetchProjectPaths = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions?paths=true');
      const data = await response.json();
      setProjectPaths(data.paths || []);
    } catch (error) {
      console.error('Failed to fetch project paths:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    Promise.all([fetchProjects(), fetchSessions(), fetchProjectPaths()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchProjects, fetchSessions, fetchProjectPaths]);

  // Refetch sessions when filter changes
  useEffect(() => {
    fetchSessions();
  }, [filterPath, fetchSessions]);

  // Add project
  const handleAddProject = async (project: Omit<Project, 'id'>) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });

      if (response.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    play('click');
    setIsLoading(true);
    Promise.all([fetchProjects(), fetchSessions(), fetchProjectPaths()]).finally(() => {
      setIsLoading(false);
      play('success');
    });
  };

  // Get suggested color for new project
  const suggestedColor = PROJECT_COLORS.find(
    c => !projects.some(p => p.color === c)
  ) || PROJECT_COLORS[0];

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Image
            src="/apple-touch-icon.png"
            alt="Claude Launcher"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span>Claude Launcher</span>
        </h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)]
                     hover:bg-[var(--card-bg)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Projects Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
            Projects
          </h2>
          <button
            onClick={() => {
              play('click');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       text-sm font-medium text-[var(--accent-cyan)]
                       border border-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10
                       transition-colors"
          >
            <Plus size={16} />
            Add Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-[var(--foreground-muted)] mb-4">
              No projects configured yet
            </p>
            <button
              onClick={() => {
                play('click');
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-[var(--accent-cyan)] text-[var(--background)] font-medium
                         hover:glow-cyan transition-all"
            >
              <Plus size={18} />
              Add Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sessions Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
            Recent Sessions
          </h2>

          {/* Filter dropdown */}
          <div className="relative">
            <select
              value={filterPath}
              onChange={e => {
                play('click');
                setFilterPath(e.target.value);
              }}
              className="appearance-none px-3 py-1.5 pr-8 rounded-lg
                         bg-[var(--background)] border border-[var(--card-border)]
                         text-sm text-[var(--foreground-muted)]
                         hover:border-[var(--foreground-muted)] cursor-pointer
                         focus:outline-none focus:border-[var(--accent-cyan)]
                         transition-colors"
            >
              <option value="">All Projects</option>
              {projectPaths.map(path => (
                <option key={path} value={path}>
                  {path.replace(/^\/Users\/[^/]+/, '~')}
                </option>
              ))}
            </select>
            <Filter
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none"
            />
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-[var(--foreground-muted)]">
              {filterPath ? 'No sessions found for this project' : 'No recent sessions found'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <SessionCard key={session.session_id} session={session} />
            ))}
          </div>
        )}
      </section>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddProject}
        suggestedColor={suggestedColor}
      />
    </main>
  );
}
