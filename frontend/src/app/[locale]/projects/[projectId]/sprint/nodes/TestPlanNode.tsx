'use client';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { FileText, Loader, CheckCircle2, XCircle } from 'lucide-react';

export type TestPlanNodeData = {
  status: 'generating' | 'draft' | 'approved' | 'failed';
  caseCount: number;
  folderCount: number;
};

const statusConfig = {
  generating: { icon: <Loader size={14} className="text-orange-500 animate-spin" />, label: 'Generating...', border: 'border-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  draft: { icon: <FileText size={14} className="text-teal-500" />, label: 'Draft ready', border: 'border-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  approved: { icon: <CheckCircle2 size={14} className="text-success" />, label: 'Approved', border: 'border-success', bg: 'bg-success-50 dark:bg-success-900/20' },
  failed: { icon: <XCircle size={14} className="text-danger" />, label: 'Failed', border: 'border-danger', bg: 'bg-danger-50 dark:bg-danger-900/20' },
};

type TestPlanNodeType = Node<TestPlanNodeData, 'testPlan'>;

export default function TestPlanNode({ data, selected }: NodeProps<TestPlanNodeType>) {
  const { status, caseCount, folderCount } = data;
  const cfg = statusConfig[status] || statusConfig.generating;

  return (
    <div
      className={`
        min-w-[170px] max-w-[220px] rounded-2xl border-2 px-3 py-2.5 shadow-lg cursor-pointer transition-all
        ${cfg.bg} ${cfg.border}
        ${selected ? 'ring-2 ring-primary/30' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-default-300 !w-2 !h-2" />

      <div className="flex items-center gap-2 mb-1.5">
        {cfg.icon}
        <span className="text-xs font-semibold">Test Plan</span>
      </div>

      <div className="text-[11px] text-default-500">{cfg.label}</div>

      {caseCount > 0 && (
        <div className="text-[10px] text-default-400 mt-1">
          {caseCount} cases · {folderCount} folders
        </div>
      )}

      {(status === 'draft' || status === 'approved') && caseCount > 0 && (
        <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 font-medium">
          Click to review ›
        </div>
      )}
    </div>
  );
}
