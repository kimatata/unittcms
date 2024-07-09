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
  if (isInclude) {
    const updatedRunCases = currentRunCases.map((runCase) => {
      if (keys.includes(runCase.caseId) && runCase.editState === 'deleted') {
        return { ...runCase, editState: 'changed' } as RunCaseType;
      }
      return runCase;
    });

    keys.forEach((caseId) => {
      const existingRunCase = currentRunCases.find((runCase) => runCase.caseId === caseId);
      if (!existingRunCase) {
        updatedRunCases.push({
          id: -1,
          runId: runId,
          caseId: caseId,
          status: -1,
          editState: 'new',
        });
      }
    });

    return updatedRunCases;
  } else {
    const updatedRunCases = currentRunCases
      .filter((runCase) => {
        // If editState is 'new', remove from the array
        if (keys.includes(runCase.caseId) && runCase.editState === 'new') {
          return false;
        }
        return true;
      })
      .map((runCase) => {
        // If editState isn't 'new', set editState to 'deleted'.
        if (keys.includes(runCase.caseId) && runCase.editState !== 'new') {
          return { ...runCase, editState: 'deleted' } as RunCaseType;
        }
        return runCase;
      });

    return updatedRunCases;
  }
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

  console.log(runCases);
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
