import { Circle } from 'lucide-react';
import { priorities } from '@/config/selection';
import { PriorityMessages } from '@/types/priority';

type Props = {
  priorityValue: number;
  priorityMessages: PriorityMessages;
};

export default function TestCasePriority({ priorityValue, priorityMessages }: Props) {
  return (
    <div className="flex items-center">
      <Circle size={8} color={priorities[priorityValue].color} fill={priorities[priorityValue].color} />
      <div className="ms-3">{priorityMessages[priorities[priorityValue].uid]}</div>
    </div>
  );
}
