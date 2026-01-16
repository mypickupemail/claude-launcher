'use client';

import { useState } from 'react';
import { X, Folder, FolderOpen } from 'lucide-react';
import { useSounds } from './SoundProvider';
import { FolderBrowser } from './FolderBrowser';
import { PROJECT_COLORS } from '@/lib/constants';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (project: { name: string; path: string; color: string; defaultTerminals: number }) => void;
  suggestedColor: string;
}

export function AddProjectModal({ isOpen, onClose, onAdd, suggestedColor }: AddProjectModalProps) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [color, setColor] = useState(suggestedColor);
  const [defaultTerminals, setDefaultTerminals] = useState(1);
  const [error, setError] = useState('');
  const [showBrowser, setShowBrowser] = useState(false);
  const { play } = useSounds();

  if (!isOpen) return null;

  const handleFolderSelect = (selectedPath: string, folderName: string) => {
    setPath(selectedPath);
    if (!name) {
      setName(folderName);
    }
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    play('click');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!path.trim()) {
      setError('Project path is required');
      return;
    }
    if (!path.startsWith('/')) {
      setError('Path must be absolute (start with /)');
      return;
    }

    onAdd({
      name: name.trim(),
      path: path.trim(),
      color,
      defaultTerminals,
    });

    play('success');
    setName('');
    setPath('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    play('click');
    setError('');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="glass-card p-6 w-full max-w-md mx-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Folder size={20} className="text-[var(--accent-cyan)]" />
              Add Project
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)]
                         hover:bg-[var(--card-bg)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project name */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--foreground-muted)]">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My Project"
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)]
                           border border-[var(--card-border)] focus:border-[var(--accent-cyan)]
                           outline-none transition-colors text-[var(--foreground)]"
              />
            </div>

            {/* Project path */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--foreground-muted)]">
                Project Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={path}
                  onChange={e => setPath(e.target.value)}
                  placeholder="/Users/you/projects/my-project"
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)]
                             border border-[var(--card-border)] focus:border-[var(--accent-cyan)]
                             outline-none transition-colors font-mono text-sm text-[var(--foreground)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    play('click');
                    setShowBrowser(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-[var(--background)]
                             border border-[var(--card-border)] hover:border-[var(--accent-cyan)]
                             text-[var(--foreground-muted)] hover:text-[var(--accent-cyan)]
                             transition-colors flex items-center gap-1.5"
                  title="Browse for folder"
                >
                  <FolderOpen size={18} />
                </button>
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--foreground-muted)]">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      play('click');
                      setColor(c);
                    }}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      c === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--background)]' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Default terminals */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--foreground-muted)]">
                Default Terminal Count
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      play('click');
                      setDefaultTerminals(num);
                    }}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      num === defaultTerminals
                        ? 'bg-[var(--accent-cyan)] text-[var(--background)]'
                        : 'bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--foreground-muted)]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[var(--accent-cyan)] text-[var(--background)]
                         font-medium hover:glow-cyan transition-all"
            >
              Add Project
            </button>
          </form>
        </div>
      </div>

      {/* Folder Browser Modal */}
      <FolderBrowser
        isOpen={showBrowser}
        onClose={() => setShowBrowser(false)}
        onSelect={handleFolderSelect}
        initialPath="~"
      />
    </>
  );
}
