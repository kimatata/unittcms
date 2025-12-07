import { Circle, CircleCheck, CircleDashed, CircleX, CircleSlash2 } from 'lucide-react';

type Props = {
  uid: string;
};

export default function RunCaseStatus({ uid }: Props) {
  if (uid === 'untested') {
    return <Circle size={16} color="#d4d4d8" />;
  } else if (uid === 'passed') {
    return <CircleCheck size={16} color="#17c964" />;
  } else if (uid === 'retest') {
    return <CircleDashed size={16} color="#f5a524" />;
  } else if (uid === 'failed') {
    return <CircleX size={16} color="#f31260" />;
  } else if (uid === 'skipped') {
    return <CircleSlash2 size={16} color="#52525b" />;
  }
}
