import { cn } from '@heroui/react';
import { ReactNode } from 'react';

interface TreeItemProps {
  style: React.CSSProperties;
  isSelected: boolean | null;
  onClick: () => void;
  toggleButton?: ReactNode;
  icon: ReactNode;
  label: string;
  actions?: ReactNode;
  className?: string;
}

export default function TreeItem({
  style,
  isSelected,
  onClick,
  toggleButton,
  icon,
  label,
  actions,
  className,
}: TreeItemProps) {
  const baseClass = '';
  const selectedClass = `${baseClass} bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 hover:bg-neutral-300`;

  return (
    <div className="mx-2">
      <div
        style={style}
        className={cn(
          'w-full py-1 pr-2 flex items-center rounded-md cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-600',
          isSelected ? selectedClass : baseClass,
          className
        )}
        onClick={onClick}
      >
        {toggleButton || <div className="ml-2" />}
        {icon}
        <span className="truncate ml-1.5">{label}</span>
        {actions && <div className="ml-auto flex items-center">{actions}</div>}
      </div>
    </div>
  );
}
