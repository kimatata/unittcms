'use client';
import { ExternalLink, GitPullRequest, GitBranch, Clock, User } from 'lucide-react';
import { Chip } from '@heroui/react';
import { SprintBranchInfo } from '@/types/project';

type Props = {
  branch: SprintBranchInfo;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function BranchDetail({ branch }: Props) {
  const prStateColor = branch.prState === 'merged' ? 'secondary' : branch.prState === 'open' ? 'warning' : 'default';

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-default-200 dark:border-neutral-700">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={15} className="text-green-500" />
          <h3 className="font-semibold text-sm break-all">{branch.name}</h3>
        </div>
        {branch.ticketId && (
          <Chip size="sm" color="primary" variant="flat" className="mt-1">{branch.ticketId}</Chip>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Commit info */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-default-500 uppercase tracking-wide">Last Commit</div>
          <div className="flex items-center gap-2 text-sm">
            <User size={13} className="text-default-400" />
            <span>{branch.lastCommitAuthor || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={13} className="text-default-400" />
            <span>{formatDate(branch.lastCommitAt)}</span>
          </div>
          {branch.sha && (
            <div className="font-mono text-xs text-default-400 bg-default-50 dark:bg-neutral-800 px-2 py-1 rounded">
              {branch.sha.slice(0, 12)}
            </div>
          )}
        </div>

        {/* PR info */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-default-500 uppercase tracking-wide">Pull Request</div>
          {branch.prNumber ? (
            <>
              <div className="flex items-center gap-2">
                <GitPullRequest size={13} className="text-default-400" />
                <Chip size="sm" color={prStateColor} variant="flat">
                  {branch.prState || 'unknown'}
                </Chip>
                <span className="text-xs text-default-500">#{branch.prNumber}</span>
              </div>
              {branch.prTitle && (
                <p className="text-sm text-default-700 dark:text-default-300">{branch.prTitle}</p>
              )}
              {branch.prTargetBranch && (
                <div className="text-xs text-default-400">
                  → <span className="font-mono">{branch.prTargetBranch}</span>
                </div>
              )}
              {branch.prUrl && (
                <a
                  href={branch.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink size={12} />
                  Open in Git
                </a>
              )}
            </>
          ) : (
            <p className="text-sm text-default-400">No pull request found</p>
          )}
        </div>
      </div>
    </div>
  );
}
