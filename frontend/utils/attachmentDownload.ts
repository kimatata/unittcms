import { logError } from './errorHandler';
import Config from '@/config/config';
const apiServer = Config.apiServer;

/**
 * Downloads an attachment by id, regardless of whether it belongs to a test
 * case or to a test case within a run.
 */
async function fetchDownloadAttachment(attachmentId: number, downloadFileName: string) {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const url = `${apiServer}/attachments/download/${attachmentId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error: unknown) {
    logError('Error downloading attachment', error);
    throw error;
  }
}

export { fetchDownloadAttachment };
