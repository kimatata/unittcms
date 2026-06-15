'use client';
import { X } from 'lucide-react';
import { Button } from '@heroui/react';
import { SprintFlow, SprintDraftFolder, SprintBranchInfo } from '@/types/project';
import BranchDetail from './BranchDetail';
import GenerationPipeline from './GenerationPipeline';
import TestPlanReview from './TestPlanReview';

type PanelMode = 'branch' | 'version' | 'testPlan' | 'generate' | null;

type Props = {
  jwt: string;
  mode: PanelMode;
  flow: SprintFlow;
  selectedBranch: SprintBranchInfo | null;
  draft: SprintDraftFolder[];
  onClose: () => void;
  onGenerationComplete: (folders: SprintDraftFolder[]) => void;
  onDraftChange: (draft: SprintDraftFolder[]) => void;
  onApproved: (count: number) => void;
};

export default function DetailPanel({
  jwt, mode, flow, selectedBranch, draft,
  onClose, onGenerationComplete, onDraftChange, onApproved,
}: Props) {
  if (!mode) return null;

  return (
    <div className="w-[380px] min-w-[340px] border-l border-default-200 dark:border-neutral-700 flex flex-col bg-white dark:bg-neutral-900 h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-default-200 dark:border-neutral-700 shrink-0">
        <span className="text-xs text-default-400 uppercase tracking-wide font-medium">
          {mode === 'branch' ? 'Branch Details' :
           mode === 'version' ? 'Version Branch' :
           mode === 'generate' ? 'Test Plan Generation' :
           'Test Plan Review'}
        </span>
        <Button size="sm" isIconOnly variant="light" onPress={onClose}>
          <X size={14} />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === 'branch' && selectedBranch && (
          <BranchDetail branch={selectedBranch} />
        )}

        {mode === 'generate' && (
          <GenerationPipeline
            jwt={jwt}
            flow={flow}
            onComplete={onGenerationComplete}
          />
        )}

        {(mode === 'testPlan' || mode === 'version') && draft.length > 0 && (
          <TestPlanReview
            jwt={jwt}
            flow={flow}
            draft={draft}
            onDraftChange={onDraftChange}
            onApproved={onApproved}
          />
        )}

        {(mode === 'testPlan' || mode === 'version') && draft.length === 0 && (
          <div className="p-4 text-sm text-default-400">
            No test plan draft yet. Use the Generate Test Plan button on the version branch node.
          </div>
        )}
      </div>
    </div>
  );
}
