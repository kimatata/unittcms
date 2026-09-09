if (typeof window !== 'undefined' && typeof window.confirm !== 'function') {
  Object.defineProperty(window, 'confirm', {
    configurable: true,
    value: () => true,
    writable: true,
  });
}
