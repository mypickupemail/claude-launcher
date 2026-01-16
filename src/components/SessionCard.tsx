'use client';

import { useState } from 'react';
import { Play, MessageSquare, Clock } from 'lucide-react';
import { useSounds } from './SoundProvider';
import { formatRelativeTime } from '@/lib/constants';

interface Session {
  session_id: string;
  first_message: number;
  last_message: number;
  message_count: number;
  cwd: string;
  summary: string | null;
}

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  const [isResuming, setIsResuming] = useState(false);
  const { play } = useSounds();

  const handleResume = async () => {
    play('click');
    setIsResuming(true);

    try {
      const response = await fetch('/api/open-terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: session.cwd,
          sessionId: session.session_id,
        }),
      });

      if (response.ok) {
        play('launch');
      }
    } catch (error) {
      console.error('Failed to resume session:', error);
    } finally {
      setIsResuming(false);
    }
  };

  // Truncate path for display
  const displayPath = session.cwd.replace(/^\/Users\/[^/]+/, '~');

  // Get project name from path
  const projectName = session.cwd.split('/').pop() || 'Unknown';

  // Truncate summary
  const displaySummary = session.summary
    ? session.summary.length > 60
      ? session.summary.slice(0, 60) + '...'
      : session.summary
    : 'No summary available';

  return (
    <div className="glass-card p-4 flex items-center gap-4 group">
      {/* Session info */}
      <div className="flex-1 min-w-0">
        {/* Summary / Title */}
        <h4 className="font-medium text-[var(--foreground)] truncate mb-1" title={session.summary || undefined}>
          {displaySummary}
        </h4>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
          <span className="path-text truncate" title={session.cwd}>
            {projectName}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            {session.message_count}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatRelativeTime(session.last_message)}
          </span>
        </div>
      </div>

      {/* Resume button */}
      <button
        onClick={handleResume}
        disabled={isResuming}
        className="flex items-center gap-2 px-4 py-2 rounded-lg
                   bg-[var(--accent-cyan)] text-[var(--background)] font-medium text-sm
                   hover:glow-cyan transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed
                   opacity-80 group-hover:opacity-100"
      >
        <Play size={14} fill="currentColor" />
        <span>{isResuming ? 'Opening...' : 'Resume'}</span>
      </button>
    </div>
  );
}
