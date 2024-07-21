type PriorityUidType = 'critical' | 'high' | 'medium' | 'low';

type PriorityType = {
  uid: PriorityUidType;
  color: string;
  chartColor: string;
};

type PriorityMessages = {
  critical: string;
  high: string;
  medium: string;
  low: string;
};

export type { PriorityUidType, PriorityType, PriorityMessages };
