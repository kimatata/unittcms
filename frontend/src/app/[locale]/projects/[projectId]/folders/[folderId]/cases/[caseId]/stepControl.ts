import Config from '@/config/config';
import { StepType } from '@/types/case';
import { logError } from '@/utils/errorHandler';
const apiServer = Config.apiServer;

async function updateSteps(jwt: string, caseId: number, steps: StepType[]) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(steps),
  };

  const url = `${apiServer}/steps/update?caseId=${caseId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error: unknown) {
    logError('Error updating steps', error);
    throw error;
  }
}

export { updateSteps };
