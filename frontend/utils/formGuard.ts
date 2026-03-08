import { useEffect } from 'react';

const isIgnoredPath = (href: string, compiledPatterns: RegExp[]): boolean => {
  return compiledPatterns.some((regex) => regex.test(href));
};

export const useFormGuard = (isDirty: boolean, confirmText: string, ignorePathPatterns?: string[]) => {
  useEffect(() => {
    const compiledPatterns: RegExp[] = (ignorePathPatterns ?? []).flatMap((pattern) => {
      try {
        return [new RegExp(pattern)];
      } catch {
        return [];
      }
    });

    const handleClick = (event: MouseEvent) => {
      if (!isDirty) return;

      if (event.target instanceof Element) {
        const anchor = event.target.closest('a:not([target="_blank"])');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href) return;

        // do not show confirm for ignored paths
        if (isIgnoredPath(href, compiledPatterns)) {
          return;
        }

        if (!window.confirm(confirmText)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        return (event.returnValue = '');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('click', handleClick, true);
    };
  }, [confirmText, isDirty, ignorePathPatterns]);
};
