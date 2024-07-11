import { useEffect } from 'react';

export const useFormGuard = (isDirty: boolean, confirmText: string) => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (isDirty && event.target instanceof Element && event.target.closest('a:not([target="_blank"]')) {
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
  }, [isDirty]);
};
