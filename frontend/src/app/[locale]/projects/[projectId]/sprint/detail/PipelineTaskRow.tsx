'use client';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { SprintGenerationLogEntry } from '@/types/project';

type Props = {
  entry: SprintGenerationLogEntry;
};

export default function PipelineTaskRow({ entry }: Props) {
  const [open, setOpen] = useState(false);

  const icon = entry.status === 'running'
    ? <Loader size={14} className="text-warning animate-spin shrink-0" />
    : entry.status === 'done'
    ? <CheckCircle2 size={14} className="text-success shrink-0" />
    : entry.status === 'failed'
    ? <XCircle size={14} className="text-danger shrink-0" />
    : <Circle size={14} className="text-default-300 shrink-0" />;

  return (
    <div className="border-b border-default-100 dark:border-neutral-700 last:border-0">
      <button
        className="w-full flex items-center gap-2 py-2 px-1 text-left hover:bg-default-50 dark:hover:bg-neutral-800 transition-colors"
        onClick={() => entry.output && setOpen(!open)}
      >
        {icon}
        <span className={`text-sm flex-1 ${entry.status === 'failed' ? 'text-danger' : entry.status === 'running' ? 'text-warning' : 'text-default-700 dark:text-default-300'}`}>
          {entry.task}
        </span>
        {entry.durationMs > 0 && (
          <span className="text-[10px] text-default-400 shrink-0">{entry.durationMs}ms</span>
        )}
        {entry.output && (
          open ? <ChevronDown size={12} className="text-default-400 shrink-0" /> : <ChevronRight size={12} className="text-default-400 shrink-0" />
        )}
      </button>
      {open && entry.output && (
        <div className="mx-1 mb-2 px-3 py-2 bg-default-50 dark:bg-neutral-800 rounded-lg">
          <pre className="text-[11px] text-default-600 dark:text-default-400 whitespace-pre-wrap break-words font-mono">
            {entry.output}
          </pre>
        </div>
      )}
    </div>
  );
}
