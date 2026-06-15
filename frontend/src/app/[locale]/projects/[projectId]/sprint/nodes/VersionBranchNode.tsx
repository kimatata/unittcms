'use client';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { GitMerge, Sparkles, CheckCircle2 } from 'lucide-react';

export type VersionBranchNodeData = {
  branchName: string;
  totalBranches: number;
  mergedCount: number;
  canGenerate: boolean;
  flowStatus: string;
  onGenerate: () => void;
};

type VersionBranchNodeType = Node<VersionBranchNodeData, 'version'>;

export default function VersionBranchNode({ data, selected }: NodeProps<VersionBranchNodeType>) {
  const { branchName, totalBranches, mergedCount, canGenerate, flowStatus, onGenerate } = data;
  const allMerged = mergedCount >= totalBranches && totalBranches > 0;
  const pct = totalBranches > 0 ? Math.round((mergedCount / totalBranches) * 100) : 0;

  const isDraft = flowStatus === 'draft';
  const isTesting = flowStatus === 'testing';

  return (
    <div
      className={`
        min-w-[200px] max-w-[240px] rounded-2xl border-2 px-4 py-3 bg-white dark:bg-neutral-900 shadow-lg
        transition-all cursor-pointer
        ${selected ? 'border-primary ring-2 ring-primary/30' : allMerged ? 'border-success' : 'border-default-300 dark:border-neutral-600'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-default-300 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-default-300 !w-2 !h-2" />

      <div className="flex items-center gap-2 mb-2">
        <GitMerge size={15} className={allMerged ? 'text-success' : 'text-default-500'} />
        <span className="text-sm font-bold truncate" title={branchName}>{branchName}</span>
        {allMerged && <CheckCircle2 size={14} className="text-success ml-auto shrink-0" />}
      </div>

      <div className="text-[11px] text-default-500 mb-1.5">
        {mergedCount}/{totalBranches} branches merged
      </div>

      {totalBranches > 0 && (
        <div className="w-full bg-default-100 dark:bg-neutral-700 rounded-full h-1.5 mb-2.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${allMerged ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {(isTesting || isDraft) ? (
        <div className="flex items-center gap-1.5 text-[11px] text-teal-600 dark:text-teal-400">
          <CheckCircle2 size={12} />
          {isTesting ? 'Test plan approved' : 'Test plan draft saved'}
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); if (canGenerate) onGenerate(); }}
          disabled={!canGenerate}
          className={`
            w-full flex items-center justify-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded-lg transition-colors
            ${canGenerate
              ? 'bg-primary/10 hover:bg-primary/20 text-primary cursor-pointer'
              : 'bg-default-100 text-default-400 cursor-not-allowed'
            }
          `}
        >
          <Sparkles size={11} />
          {canGenerate ? 'Create Test Plan' : `Waiting (${totalBranches - mergedCount} pending)`}
        </button>
      )}
    </div>
  );
}
