'use client';
import { useState } from 'react';
import { Button, Input, Textarea } from '@heroui/react';
import { addToast } from '@heroui/react';
import {
  Plus, Trash2, CheckCircle2, Save, FolderOpen, ChevronDown, ChevronRight,
} from 'lucide-react';
import { SprintDraftFolder, SprintDraftCase, SprintFlow } from '@/types/project';
import { saveDraft, approveDraft } from '@/utils/sprintControl';
import { logError } from '@/utils/errorHandler';

type Props = {
  jwt: string;
  flow: SprintFlow;
  draft: SprintDraftFolder[];
  onDraftChange: (draft: SprintDraftFolder[]) => void;
  onApproved: (count: number) => void;
};

function CaseEditor({
  testCase,
  onUpdate,
  onDelete,
}: {
  testCase: SprintDraftCase;
  onUpdate: (c: SprintDraftCase) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-teal-200 dark:border-teal-800 rounded-lg mb-2 overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-teal-50 dark:bg-teal-900/20 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={12} className="text-default-400 shrink-0" /> : <ChevronRight size={12} className="text-default-400 shrink-0" />}
        <Input
          size="sm"
          value={testCase.title}
          onValueChange={(v) => onUpdate({ ...testCase, title: v })}
          variant="underlined"
          placeholder="Test case title"
          classNames={{ input: 'text-sm font-medium', base: 'flex-1' }}
          onClick={(e) => e.stopPropagation()}
        />
        <Button
          size="sm"
          isIconOnly
          variant="light"
          color="danger"
          onPress={onDelete}
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 size={12} />
        </Button>
      </div>
      {expanded && (
        <div className="px-3 py-2 flex flex-col gap-2">
          <div>
            <div className="text-[10px] font-medium text-default-400 uppercase mb-1">Steps (one per line)</div>
            <Textarea
              size="sm"
              variant="bordered"
              value={testCase.steps.join('\n')}
              onValueChange={(v) => onUpdate({ ...testCase, steps: v.split('\n').filter(Boolean) })}
              minRows={2}
              maxRows={8}
              placeholder="Step 1&#10;Step 2&#10;Step 3"
              classNames={{ input: 'text-xs font-mono' }}
            />
          </div>
          <div>
            <div className="text-[10px] font-medium text-default-400 uppercase mb-1">Expected Result</div>
            <Input
              size="sm"
              variant="bordered"
              value={testCase.expectedResult}
              onValueChange={(v) => onUpdate({ ...testCase, expectedResult: v })}
              placeholder="Expected result..."
              classNames={{ input: 'text-xs' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FolderSection({
  folder,
  folderIdx,
  onUpdate,
  onDelete,
}: {
  folder: SprintDraftFolder;
  folderIdx: number;
  onUpdate: (f: SprintDraftFolder) => void;
  onDelete: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const updateCase = (caseIdx: number, updated: SprintDraftCase) => {
    const cases = [...folder.cases];
    cases[caseIdx] = updated;
    onUpdate({ ...folder, cases });
  };

  const deleteCase = (caseIdx: number) => {
    onUpdate({ ...folder, cases: folder.cases.filter((_, i) => i !== caseIdx) });
  };

  const addCase = () => {
    onUpdate({ ...folder, cases: [...folder.cases, { title: 'New test case', steps: [], expectedResult: '' }] });
  };

  return (
    <div className="mb-4 border border-default-200 dark:border-neutral-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-default-50 dark:bg-neutral-800/50">
        <button onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <FolderOpen size={14} className="text-orange-500" />
        <Input
          size="sm"
          value={folder.name}
          onValueChange={(v) => onUpdate({ ...folder, name: v })}
          variant="underlined"
          classNames={{ input: 'text-sm font-semibold', base: 'flex-1' }}
        />
        <span className="text-[10px] text-default-400 shrink-0">{folder.cases.length} cases</span>
        <Button size="sm" isIconOnly variant="light" color="danger" onPress={onDelete}>
          <Trash2 size={12} />
        </Button>
      </div>
      {!collapsed && (
        <div className="p-3">
          {folder.cases.map((c, caseIdx) => (
            <CaseEditor
              key={caseIdx}
              testCase={c}
              onUpdate={(updated) => updateCase(caseIdx, updated)}
              onDelete={() => deleteCase(caseIdx)}
            />
          ))}
          <Button
            size="sm"
            variant="bordered"
            color="default"
            startContent={<Plus size={12} />}
            onPress={addCase}
            className="mt-1 w-full border-dashed"
          >
            Add test case
          </Button>
        </div>
      )}
    </div>
  );
}

export default function TestPlanReview({ jwt, flow, draft, onDraftChange, onApproved }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const totalCases = draft.reduce((s, f) => s + f.cases.length, 0);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveDraft(jwt, flow.id, draft);
      addToast({ title: 'Draft saved', color: 'success' });
    } catch (err) {
      logError('TestPlanReview saveDraft', err);
      addToast({ title: 'Failed to save draft', color: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await approveDraft(jwt, flow.id, draft);
      addToast({ title: `${result.count} test cases added to sprint suite`, color: 'success' });
      onApproved(result.count);
    } catch (err) {
      logError('TestPlanReview approve', err);
      addToast({ title: 'Failed to approve test plan', color: 'danger' });
    } finally {
      setIsApproving(false);
    }
  };

  const addFolder = () => {
    onDraftChange([...draft, { name: 'New Folder', cases: [] }]);
  };

  const updateFolder = (idx: number, updated: SprintDraftFolder) => {
    const updated2 = [...draft];
    updated2[idx] = updated;
    onDraftChange(updated2);
  };

  const deleteFolder = (idx: number) => {
    onDraftChange(draft.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-default-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Review Test Plan</h3>
            <p className="text-xs text-default-400 mt-0.5">{totalCases} test cases across {draft.length} folders</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${flow.status === 'testing' ? 'bg-success-100 text-success-700' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'}`}>
            {flow.status === 'testing' ? 'Approved' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {draft.map((folder, idx) => (
          <FolderSection
            key={idx}
            folder={folder}
            folderIdx={idx}
            onUpdate={(updated) => updateFolder(idx, updated)}
            onDelete={() => deleteFolder(idx)}
          />
        ))}

        <Button
          size="sm"
          variant="flat"
          color="default"
          startContent={<Plus size={13} />}
          onPress={addFolder}
          className="w-full mt-2"
        >
          Add folder
        </Button>
      </div>

      {flow.status !== 'testing' && (
        <div className="p-4 border-t border-default-200 dark:border-neutral-700 flex gap-2">
          <Button
            size="sm"
            variant="flat"
            startContent={<Save size={13} />}
            isLoading={isSaving}
            onPress={handleSaveDraft}
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            color="success"
            startContent={<CheckCircle2 size={13} />}
            isLoading={isApproving}
            onPress={handleApprove}
            isDisabled={totalCases === 0}
          >
            Approve & Add to Suite
          </Button>
        </div>
      )}
    </div>
  );
}
