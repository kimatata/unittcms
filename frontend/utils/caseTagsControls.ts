import { logError } from './errorHandler';
import Config from '@/config/config';
const apiServer = Config.apiServer;

export async function updateCaseTags(jwt: string, caseId: number, tagIds: number[], projectId: string) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ tagIds }),
  };

  const url = `${apiServer}/casetags/update?projectId=${projectId}?&caseId=${caseId}`;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error: unknown) {
    logError('Error updating case tags:', error);
  }
}
