export function getFilenameFromContentDisposition(disposition: string | null): string | null {
  if (!disposition) return null;

  const filenameStar = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (filenameStar?.[1]) {
    try {
      return decodeURIComponent(filenameStar[1]);
    } catch {
      // ignore
    }
  }

  const filename = disposition.match(/filename\s*=\s*"([^"]+)"/i) || disposition.match(/filename\s*=\s*([^;]+)/i);
  if (filename?.[1]) return filename[1].trim();

  return null;
}
