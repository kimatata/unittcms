'use client';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { GitBranch, GitPullRequest, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { SprintBranchInfo } from '@/types/project';

export type BranchNodeData = {
  branch: SprintBranchInfo;
  isSelected: boolean;
};

type BranchNodeType = Node<BranchNodeData, 'branch'>;

function prStateColor(state: string | null): string {
  if (state === 'merged') return 'text-purple-500';
  if (state === 'open') return 'text-yellow-500';
  if (state === 'closed') return 'text-default-400';
  return 'text-default-300';
}

function prStateIcon(state: string | null) {
  if (state === 'merged') return <CheckCircle2 size={11} className="text-purple-500" />;
  if (state === 'open') return <GitPullRequest size={11} className="text-yellow-500" />;
  return <Clock size={11} className="text-default-400" />;
}

export default function BranchNode({ data, selected }: NodeProps<BranchNodeType>) {
  const { branch } = data;
  const isMerged = branch.prState === 'merged';

  return (
    <div
      className={`
        min-w-[160px] max-w-[200px] rounded-xl border-2 px-3 py-2 bg-white dark:bg-neutral-900 shadow-md
        transition-all cursor-pointer
        ${selected ? 'border-primary ring-2 ring-primary/30' : isMerged ? 'border-purple-400 dark:border-purple-600' : 'border-green-400 dark:border-green-600'}
        ${isMerged ? 'opacity-70' : ''}
      `}
    >
      <Handle type="source" position={Position.Bottom} className="!bg-default-300 !w-2 !h-2" />
      <Handle type="target" position={Position.Top} className="!bg-default-300 !w-2 !h-2" />

      <div className="flex items-center gap-1.5 mb-1">
        <GitBranch size={13} className={isMerged ? 'text-purple-400' : 'text-green-500'} />
        <span className="text-xs font-semibold truncate max-w-[130px]" title={branch.name}>
          {branch.name}
        </span>
      </div>

      {branch.ticketId && (
        <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
          {branch.ticketId}
        </span>
      )}

      <div className="flex items-center gap-1 mt-1.5">
        {prStateIcon(branch.prState)}
        <span className={`text-[10px] ${prStateColor(branch.prState)}`}>
          {branch.prState === 'merged' ? 'Merged' : branch.prState === 'open' ? 'PR open' : 'No PR'}
        </span>
        {branch.prUrl && (
          <a href={branch.prUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
            <ExternalLink size={9} className="text-default-300 hover:text-primary" />
          </a>
        )}
      </div>

      {branch.lastCommitAuthor && (
        <div className="text-[10px] text-default-400 mt-0.5 truncate">
          {branch.lastCommitAuthor}
        </div>
      )}
    </div>
  );
}
