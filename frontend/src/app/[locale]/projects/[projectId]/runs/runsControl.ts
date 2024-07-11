import Config from '@/config/config';
const apiServer = Config.apiServer;
import { RunType, RunCaseType } from '@/types/run';

async function fetchRun(jwt: string, runId: number) {
  const url = `${apiServer}/runs/${runId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

async function fetchRuns(jwt: string, projectId: number) {
  const url = `${apiServer}/runs?projectId=${projectId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

async function createRun(jwt: string, projectId: number, name: string, description: string) {
  const newTestRun = {
    name,
    configurations: 0,
    description,
    state: 0,
  };

  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(newTestRun),
  };

  const url = `${apiServer}/runs?projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error creating new test run:', error);
    throw error;
  }
}

async function updateRun(jwt: string, updateTestRun: RunType) {
  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(updateTestRun),
  };

  const url = `${apiServer}/runs/${updateTestRun.id}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error updating run:', error);
    throw error;
  }
}

async function deleteRun(jwt: string, runId: number) {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/runs/${runId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Error deleting run:', error);
    throw error;
  }
}

async function fetchRunCases(jwt: string, runId: number) {
  const url = `${apiServer}/runcases?runId=${runId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

function processRunCases(
  isInclude: boolean,
  keys: number[],
  runId: number,
  currentRunCases: RunCaseType[]
): RunCaseType[] {
  const updatedRunCases = [...currentRunCases];

  if (isInclude) {
    keys.forEach((caseId) => {
      const existingRunCase = currentRunCases.find((runCase) => runCase.caseId === caseId);
      if (existingRunCase) {
        // already included
        if (existingRunCase.editState === 'notChanged') {
          // do nothing
        } else if (existingRunCase.editState === 'changed') {
          // do nothing
        } else if (existingRunCase.editState === 'new') {
          // do nothing
        } else if (existingRunCase.editState === 'deleted') {
          existingRunCase.editState = 'changed';
        }
      } else {
        updatedRunCases.push({
          id: -1,
          runId: runId,
          caseId: caseId,
          status: -1,
          editState: 'new',
        });
      }
    });
  } else {
    keys.forEach((caseId) => {
      const existingRunCase = currentRunCases.find((runCase) => runCase.caseId === caseId);
      if (!existingRunCase) {
        // already excluded
      } else {
        if (existingRunCase.editState === 'notChanged') {
          existingRunCase.editState = 'deleted';
        } else if (existingRunCase.editState === 'changed') {
          existingRunCase.editState = 'deleted';
        } else if (existingRunCase.editState === 'new') {
          existingRunCase.editState = 'deleted';
        } else if (existingRunCase.editState === 'deleted') {
          // do nothing
        }
      }
    });
  }

  return updatedRunCases;
}

async function updateRunCases(jwt: string, runId: number, runCases: RunCaseType[]) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(runCases),
  };

  const url = `${apiServer}/runcases/update?runId=${runId}`;
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

export { fetchRun, fetchRuns, createRun, updateRun, deleteRun, fetchRunCases, processRunCases, updateRunCases };
