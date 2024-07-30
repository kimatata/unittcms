import { CaseType } from '@/types/case';
import { RunType, RunCaseType } from '@/types/run';
import Config from '@/config/config';
import { testRunCaseStatus } from '@/config/selection';
const apiServer = Config.apiServer;

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

function changeStatus(changeCaseId: number, newStatus: number, currentTestCases: CaseType[]): CaseType[] {
  const updatedTestCases = [...currentTestCases];

  const found = updatedTestCases.find((testCase) => testCase.id === changeCaseId);
  if (found && found.RunCases && testRunCaseStatus.length > 0) {
    const runCase = found.RunCases[0];
    if (runCase.editState === 'notChanged') {
      runCase.status = newStatus;
      runCase.editState = 'changed';
    } else if (runCase.editState === 'changed') {
      runCase.status = newStatus;
    } else if (runCase.editState === 'new') {
      runCase.status = newStatus;
    } else if (runCase.editState === 'deleted') {
      // do nothing
    }
  }

  return updatedTestCases;
}

function includeExcludeTestCases(
  isInclude: boolean,
  keys: number[],
  runId: number,
  currentTestCases: CaseType[]
): CaseType[] {
  const updatedTestCases = [...currentTestCases];

  if (isInclude) {
    keys.forEach((caseId) => {
      const targetCase = updatedTestCases.find((testCase) => testCase.id === caseId);
      if (!targetCase) {
        console.error('failed to find target case');
        return;
      }

      if (targetCase.RunCases && targetCase.RunCases.length > 0) {
        // already included
        if (targetCase.RunCases[0].editState === 'notChanged') {
          // do nothing
        } else if (targetCase.RunCases[0].editState === 'changed') {
          // do nothing
        } else if (targetCase.RunCases[0].editState === 'new') {
          // do nothing
        } else if (targetCase.RunCases[0].editState === 'deleted') {
          if (targetCase.RunCases[0].id > 0) {
            // when id is valid (already included)
            targetCase.RunCases[0].editState = 'changed';
          } else {
            // when id is invalid (has not included)
            targetCase.RunCases[0].editState = 'new';
          }
        }
      } else {
        const newRunCase = {
          id: -1,
          runId: runId,
          status: 0,
          editState: 'new',
        } as RunCaseType;
        targetCase.RunCases = [newRunCase];
      }
    });
  } else {
    keys.forEach((caseId) => {
      const targetCase = updatedTestCases.find((testCase) => testCase.id === caseId);
      if (!targetCase) {
        console.error('failed to find target case');
        return;
      }

      if (!targetCase.RunCases || targetCase.RunCases.length == 0) {
        // already excluded
      } else {
        if (targetCase.RunCases[0].editState === 'notChanged') {
          targetCase.RunCases[0].editState = 'deleted';
        } else if (targetCase.RunCases[0].editState === 'changed') {
          targetCase.RunCases[0].editState = 'deleted';
        } else if (targetCase.RunCases[0].editState === 'new') {
          targetCase.RunCases[0].editState = 'deleted';
        } else if (targetCase.RunCases[0].editState === 'deleted') {
          // do nothing
        }
      }
    });
  }

  return updatedTestCases;
}

async function updateRunCases(jwt: string, runId: number, testCases: CaseType[]) {
  const runCases: RunCaseType[] = [];
  testCases.forEach((itr) => {
    if (itr.RunCases && itr.RunCases.length > 0) {
      runCases.push({
        id: itr.RunCases[0].id,
        caseId: itr.id,
        runId: runId,
        status: itr.RunCases[0].status,
        editState: itr.RunCases[0].editState,
        createdAt: '0',
        updatedAt: '0',
      });
    }
  });

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

async function fetchProjectCases(jwt: string, projectId: number) {
  const url = `${apiServer}/cases/byproject?projectId=${projectId}`;

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

export {
  fetchRun,
  fetchRuns,
  createRun,
  updateRun,
  deleteRun,
  fetchRunCases,
  changeStatus,
  includeExcludeTestCases,
  updateRunCases,
  fetchProjectCases,
};
