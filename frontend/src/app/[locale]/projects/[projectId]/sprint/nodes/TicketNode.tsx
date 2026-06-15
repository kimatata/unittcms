'use client';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Ticket } from 'lucide-react';

export type TicketNodeData = {
  ticketId: string;
  title?: string;
};

type TicketNodeType = Node<TicketNodeData, 'ticket'>;

export default function TicketNode({ data, selected }: NodeProps<TicketNodeType>) {
  return (
    <div
      className={`
        min-w-[130px] max-w-[180px] rounded-xl border-2 px-3 py-2 bg-white dark:bg-neutral-900 shadow cursor-pointer
        transition-all border-blue-400 dark:border-blue-600
        ${selected ? 'ring-2 ring-primary/30' : ''}
      `}
    >
      <Handle type="source" position={Position.Bottom} className="!bg-default-300 !w-2 !h-2" />

      <div className="flex items-center gap-1.5">
        <Ticket size={12} className="text-blue-500 shrink-0" />
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{data.ticketId}</span>
      </div>
      {data.title && (
        <div className="text-[10px] text-default-500 mt-0.5 line-clamp-2">{data.title}</div>
      )}
    </div>
  );
}
