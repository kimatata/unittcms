import Config from '@/config/config';
const apiServer = Config.apiServer;

async function fetchCreateStep(jwt: string, newStepNo: number, parentCaseId: number) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/steps?newStepNo=${newStepNo}&caseId=${parentCaseId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

async function fetchDeleteStep(jwt: string, stepId: number, parentCaseId: number) {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/steps/${stepId}?caseId=${parentCaseId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

export { fetchCreateStep, fetchDeleteStep };
