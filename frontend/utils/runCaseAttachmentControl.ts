import { logError } from './errorHandler';
import { AttachmentType } from '@/types/case';
import Config from '@/config/config';
const apiServer = Config.apiServer;

export async function fetchRunCaseAttachments(jwt: string, runCaseId: number): Promise<AttachmentType[]> {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/runcaseattachments?runCaseId=${runCaseId}`;
  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error: unknown) {
    logError('Error fetching run case attachments', error);
    return [];
  }
}

export async function createRunCaseAttachments(
  jwt: string,
  runCaseId: number,
  files: File[]
): Promise<AttachmentType[] | null> {
  try {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    // Content-Type is intentionally omitted so the browser sets the multipart boundary
    const url = `${apiServer}/runcaseattachments?runCaseId=${runCaseId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data || null;
  } catch (error: unknown) {
    logError('Error uploading run case attachments', error);
    return null;
  }
}

export async function deleteRunCaseAttachment(jwt: string, runCaseId: number, attachmentId: number): Promise<void> {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/runcaseattachments/${attachmentId}?runCaseId=${runCaseId}`;
  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: unknown) {
    logError('Error deleting run case attachment', error);
    throw error;
  }
}
