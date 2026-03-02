import { useEffect } from 'react';

export const isIgnoredPath = (href: string, ignorePaths?: string[]): boolean => {
  if (!ignorePaths) return false;
  return ignorePaths.some((path) => {
    try {
      return new RegExp(path).test(href);
    } catch {
      return false;
    }
  });
};

export const useFormGuard = (isDirty: boolean, confirmText: string, ignorePaths?: string[]) => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isDirty) return;

      if (event.target instanceof Element) {
        const anchor = event.target.closest('a:not([target="_blank"])');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href) return;

        // do not show confirm for ignored paths
        if (isIgnoredPath(href, ignorePaths)) {
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
  }, [confirmText, isDirty, ignorePaths]);
};
