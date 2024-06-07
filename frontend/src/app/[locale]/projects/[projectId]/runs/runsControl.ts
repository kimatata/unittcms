import Config from '@/config/config';
const apiServer = Config.apiServer;
import { RunType, RunCaseInfoType } from '@/types/run';

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

async function createRunCase(jwt: string, runId: number, caseId: number) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/runcases?runId=${runId}&caseId=${caseId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error creating new runcase:', error);
    throw error;
  }
}

async function updateRunCase(jwt: string, runId: number, caseId: number, status: number) {
  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/runcases?runId=${runId}&caseId=${caseId}&status=${status}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error updating runcase:', error);
    throw error;
  }
}

async function bulkCreateRunCases(jwt: string, runId: number, runCaseInfo: RunCaseInfoType[]) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(runCaseInfo),
  };

  const url = `${apiServer}/runcases/bulknew?runId=${runId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error creating new runcase:', error);
    throw error;
  }
}

async function deleteRunCase(jwt: string, runId: number, caseId: number) {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/runcases?runId=${runId}&caseId=${caseId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Error deleting runcase:', error);
    throw error;
  }
}

async function bulkDeleteRunCases(jwt: string, runId: number, runCaseInfo: RunCaseInfoType[]) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(runCaseInfo),
  };

  const url = `${apiServer}/runcases/bulkdelete?runId=${runId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Error deleting runcase:', error);
    throw error;
  }
}

export {
  fetchRun,
  fetchRuns,
  createRun,
  updateRun,
  deleteRun,
  fetchRunCases,
  createRunCase,
  updateRunCase,
  bulkCreateRunCases,
  deleteRunCase,
  bulkDeleteRunCases,
};
