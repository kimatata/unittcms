import Config from '@/config/config';
import { logError } from '@/utils/errorHandler';
const apiServer = Config.apiServer;

async function fetchCreateAttachments(caseId: number, files: File[]) {
  try {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const url = `${apiServer}/attachments?parentCaseId=${caseId}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error: unknown) {
    logError('Error uploading files', error);
  }
}

async function fetchDeleteAttachment(attachmentId: number) {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const url = `${apiServer}/attachments/${attachmentId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: unknown) {
    logError('Error deleting file:', error);
    throw error;
  }
}

export { fetchCreateAttachments, fetchDeleteAttachment };
