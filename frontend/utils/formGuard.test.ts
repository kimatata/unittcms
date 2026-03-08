// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// mock cleanup
let cleanupFn: (() => void) | undefined;
vi.mock('react', () => ({
  useEffect: (fn: () => void) => {
    cleanupFn = fn() as (() => void) | undefined;
  },
}));

import { useFormGuard } from './formGuard';

describe('useFormGuard', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // @ts-expect-error - we will mock confirm
    confirmSpy = vi.spyOn(window, 'confirm');
    cleanupFn = undefined;
  });

  afterEach(() => {
    cleanupFn?.();
    cleanupFn = undefined;
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  // helper: simulate clicking an anchor
  const clickAnchor = (href: string, target?: string): MouseEvent => {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', href);
    if (target) anchor.setAttribute('target', target);
    document.body.appendChild(anchor);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);
    return event;
  };

  describe('Basic functionality', () => {
    it('does not show confirm when form is clean', () => {
      useFormGuard(false, 'Leave?');
      clickAnchor('/some-path');

      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('shows confirm with the given text when dirty', () => {
      confirmSpy.mockReturnValue(true);
      useFormGuard(true, 'Are you sure?');
      clickAnchor('/other-page');

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure?');
    });

    it('prevents navigation when dirty and user cancels confirm', () => {
      confirmSpy.mockReturnValue(false);
      useFormGuard(true, 'Leave?');

      const event = clickAnchor('/other-page');
      expect(event.defaultPrevented).toBe(true);
    });

    it('allows navigation when dirty and user confirms', () => {
      confirmSpy.mockReturnValue(true);
      useFormGuard(true, 'Leave?');

      const event = clickAnchor('/other-page');
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('external links', () => {
    it('does not show confirm for anchor with target="_blank"', () => {
      useFormGuard(true, 'Leave?');
      clickAnchor('https://example.com', '_blank');

      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });

  describe('UnitTCMS use case', () => {
    it('does not show confirm when navigating to case detail page of test run', () => {
      const projectId = '1';
      const runId = '2';
      useFormGuard(true, 'Leave?', [`/projects/${projectId}/runs/${runId}/cases/\\d+`]);
      clickAnchor(`/projects/${projectId}/runs/${runId}/cases/123`);

      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('shows confirm when navigating to test cases page', () => {
      const projectId = '1';
      const runId = '2';
      useFormGuard(true, 'Leave?', [`/projects/${projectId}/runs/${runId}/cases/\\d+`]);
      clickAnchor(`/projects/${projectId}/runs/${runId}/cases`);

      expect(confirmSpy).toHaveBeenCalled();
    });
  });
});
