'use client';
import { useState, useRef, useEffect, ReactNode } from 'react';

type Props = {
  leftPane: ReactNode;
  rightPane: ReactNode;
};

export default function ResizablePanes({ leftPane, rightPane }: Props) {
  const [leftWidth, setLeftWidth] = useState(70); // デフォルト70%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const minLeftWidth = 40; // 左パネルの最小幅 40%
  const minRightWidth = 15; // 右パネルの最小幅 15%

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // 最小幅と最大幅を考慮
      const maxLeftWidth = 100 - minRightWidth;
      const clampedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newLeftWidth));

      setLeftWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="flex h-full" style={{ userSelect: isDragging ? 'none' : 'auto' }}>
      <div
        className="border-r-1 dark:border-neutral-700 overflow-auto"
        style={{ width: `${leftWidth}%`, minWidth: `${minLeftWidth}%` }}
      >
        {leftPane}
      </div>

      <div
        className="w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors"
        onMouseDown={handleMouseDown}
        style={{ flexShrink: 0 }}
      />

      <div className="flex-1 overflow-auto" style={{ minWidth: `${minRightWidth}%` }}>
        {rightPane}
      </div>
    </div>
  );
}
