// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// useEffect をモックして即時実行に置き換える
vi.mock('react', () => ({
  useEffect: (fn: () => void | (() => void)) => fn(),
}));

import { useFormGuard } from './formGuard';

describe('useFormGuard', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  // helper: アンカー要素を作って click イベントを発火し、要素を返す
  const clickAnchor = (href: string, target?: string): MouseEvent => {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', href);
    if (target) anchor.setAttribute('target', target);
    document.body.appendChild(anchor);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);
    return event;
  };

  // --- event listener lifecycle ---

  it('registers click and beforeunload listeners on mount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    useFormGuard(false, 'Leave?');

    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
  });

  // --- beforeunload ---

  it('prevents default on beforeunload when form is dirty', () => {
    useFormGuard(true, 'Leave?');

    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does not prevent default on beforeunload when form is clean', () => {
    useFormGuard(false, 'Leave?');

    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  // --- click on anchor: form is clean ---

  it('does not show confirm when form is clean and anchor is clicked', () => {
    useFormGuard(false, 'Leave?');
    clickAnchor('/some-path');

    expect(confirmSpy).not.toHaveBeenCalled();
  });

  // --- click on anchor: form is dirty ---

  it('shows confirm with the given text when dirty and anchor is clicked', () => {
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

  // --- external link (_blank) ---

  it('does not show confirm for anchor with target="_blank"', () => {
    useFormGuard(true, 'Leave?');
    clickAnchor('https://example.com', '_blank');

    expect(confirmSpy).not.toHaveBeenCalled();
  });

  // --- non-anchor click ---

  it('does not show confirm when a non-anchor element is clicked', () => {
    useFormGuard(true, 'Leave?');

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.click();

    expect(confirmSpy).not.toHaveBeenCalled();
  });

  // --- ignorePathPatterns ---

  it('does not show confirm when href matches an ignored path pattern', () => {
    useFormGuard(true, 'Leave?', ['^/settings/.*']);
    clickAnchor('/settings/profile');

    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('shows confirm when href does not match any ignored path pattern', () => {
    confirmSpy.mockReturnValue(true);
    useFormGuard(true, 'Leave?', ['^/settings/.*']);
    clickAnchor('/dashboard');

    expect(confirmSpy).toHaveBeenCalled();
  });

  it('skips invalid regex patterns without throwing', () => {
    confirmSpy.mockReturnValue(true);
    expect(() => useFormGuard(true, 'Leave?', ['[invalid'])).not.toThrow();
  });

  it('handles multiple ignore patterns and matches any one of them', () => {
    useFormGuard(true, 'Leave?', ['^/settings/.*', '^/profile$']);

    clickAnchor('/settings/security');
    clickAnchor('/profile');

    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
