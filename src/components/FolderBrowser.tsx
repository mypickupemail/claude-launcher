'use client';

import { useState, useEffect, useCallback } from 'react';
import { Folder, ChevronUp, Check, X, Home } from 'lucide-react';
import { useSounds } from './SoundProvider';

interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface FolderBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string, folderName: string) => void;
  initialPath?: string;
}

export function FolderBrowser({ isOpen, onClose, onSelect, initialPath }: FolderBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath || '~');
  const [directories, setDirectories] = useState<DirectoryEntry[]>([]);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { play } = useSounds();

  // Fetch directory contents
  const fetchDirectory = useCallback(async (path: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load directory');
        return;
      }

      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setDirectories(data.directories);
    } catch (e) {
      setError('Failed to load directory');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial directory
  useEffect(() => {
    if (isOpen) {
      fetchDirectory(initialPath || '~');
    }
  }, [isOpen, initialPath, fetchDirectory]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    play('click');
    fetchDirectory(path);
  };

  const handleSelect = () => {
    play('success');
    const folderName = currentPath.split('/').pop() || '';
    onSelect(currentPath, folderName);
    onClose();
  };

  const handleClose = () => {
    play('click');
    onClose();
  };

  // Get display path (shortened)
  const displayPath = currentPath.replace(/^\/Users\/[^/]+/, '~');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-5 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Folder size={18} className="text-[var(--accent-cyan)]" />
            Select Folder
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)]
                       hover:bg-[var(--card-bg)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current path */}
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-[var(--background)]
                        border border-[var(--card-border)] font-mono text-sm overflow-hidden">
          <span className="truncate text-[var(--foreground-muted)]" title={currentPath}>
            {displayPath}
          </span>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => handleNavigate('~')}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                       bg-[var(--background)] border border-[var(--card-border)]
                       hover:border-[var(--foreground-muted)] transition-colors
                       disabled:opacity-50"
          >
            <Home size={14} />
            Home
          </button>
          {parentPath && (
            <button
              onClick={() => handleNavigate(parentPath)}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm
                         bg-[var(--background)] border border-[var(--card-border)]
                         hover:border-[var(--foreground-muted)] transition-colors
                         disabled:opacity-50"
            >
              <ChevronUp size={14} />
              Up
            </button>
          )}
        </div>

        {/* Directory list */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] rounded-lg
                        bg-[var(--background)] border border-[var(--card-border)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-[var(--foreground-muted)]">
              Loading...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-400">
              {error}
            </div>
          ) : directories.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[var(--foreground-muted)]">
              No subdirectories
            </div>
          ) : (
            <div className="divide-y divide-[var(--card-border)]">
              {directories.map(dir => (
                <button
                  key={dir.path}
                  onClick={() => handleNavigate(dir.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left
                             hover:bg-[var(--card-bg)] transition-colors"
                >
                  <Folder size={18} className="text-[var(--accent-amber)] shrink-0" />
                  <span className="truncate">{dir.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleClose}
            className="flex-1 py-2 rounded-lg border border-[var(--card-border)]
                       hover:bg-[var(--card-bg)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg
                       bg-[var(--accent-cyan)] text-[var(--background)] font-medium
                       hover:glow-cyan transition-all"
          >
            <Check size={18} />
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  );
}
