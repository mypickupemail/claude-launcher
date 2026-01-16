'use client';

import { useState } from 'react';
import { Play, Trash2, ChevronDown } from 'lucide-react';
import { useSounds } from './SoundProvider';

interface Project {
  id: string;
  name: string;
  path: string;
  color: string;
  defaultTerminals: number;
}

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [terminalCount, setTerminalCount] = useState(project.defaultTerminals);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { play } = useSounds();

  const handleLaunch = async () => {
    play('click');
    setIsLaunching(true);

    try {
      const response = await fetch('/api/open-terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: project.path,
          count: terminalCount,
        }),
      });

      if (response.ok) {
        play('launch');
      }
    } catch (error) {
      console.error('Failed to open terminal:', error);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleDelete = () => {
    play('click');
    onDelete(project.id);
  };

  // Truncate path for display
  const displayPath = project.path.replace(/^\/Users\/[^/]+/, '~');

  return (
    <div className="glass-card p-5 relative group">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg
                   text-[var(--foreground-muted)] hover:text-red-400 hover:bg-red-400/10 transition-all"
        aria-label="Delete project"
      >
        <Trash2 size={16} />
      </button>

      {/* Project name with color indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <h3 className="font-semibold text-[var(--foreground)] text-lg truncate pr-8">
          {project.name}
        </h3>
      </div>

      {/* Project path */}
      <p className="path-text truncate mb-4" title={project.path}>
        {displayPath}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Terminal count selector */}
        <div className="relative">
          <button
            onClick={() => {
              play('click');
              setShowDropdown(!showDropdown);
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--background)]
                       border border-[var(--card-border)] hover:border-[var(--foreground-muted)]
                       text-sm transition-colors"
          >
            <span className="font-mono">{terminalCount}</span>
            <ChevronDown size={14} className="text-[var(--foreground-muted)]" />
          </button>

          {showDropdown && (
            <div className="absolute bottom-full mb-1 left-0 bg-[var(--background-secondary)]
                            border border-[var(--card-border)] rounded-lg py-1 z-10 min-w-[48px]">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    play('click');
                    setTerminalCount(num);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-sm text-left hover:bg-[var(--card-bg)] transition-colors
                             ${num === terminalCount ? 'text-[var(--accent-cyan)]' : ''}`}
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          disabled={isLaunching}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                     font-medium text-sm transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: project.color,
            color: '#0f172a',
          }}
        >
          <Play size={16} fill="currentColor" />
          <span>{isLaunching ? 'Opening...' : 'Launch'}</span>
        </button>
      </div>
    </div>
  );
}
