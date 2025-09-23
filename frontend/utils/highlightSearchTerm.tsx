import { cn } from '@heroui/theme';
import { ReactNode } from 'react';

interface HighlightSearchTermProps {
  text: string;
  searchTerm: string;
  className?: string;
  minSearchLength?: number;
}

export function highlightSearchTerm({
  text,
  searchTerm,
  className,
  minSearchLength = 1,
}: HighlightSearchTermProps): ReactNode {
  if (!text || !searchTerm || searchTerm.length < minSearchLength) {
    return text || null;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (regex.test(part)) {
          return (
            <mark key={`${part}-${index}`} className={cn(className, 'bg-yellow-200 dark:bg-yellow-60 py-0.5 rounded')}>
              {part}
            </mark>
          );
        }
        return part;
      })}
    </>
  );
}
