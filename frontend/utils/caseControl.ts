import Config from '@/config/config';
const apiServer = Config.apiServer;
import { CaseType } from '@/types/case';

async function fetchCase(jwt: string, caseId: number) {
  const url = `${apiServer}/cases/${caseId}`;

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

async function fetchCases(jwt: string, folderId: number) {
  const url = `${apiServer}/cases?folderId=${folderId}`;

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

async function createCase(jwt: string, folderId: string, title: string, description: string) {
  const newCase = {
    title: title,
    state: 0,
    priority: 2,
    type: 0,
    automationStatus: 0,
    description: description,
    template: 0,
    preConditions: '',
    expectedResults: '',
  };

  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(newCase),
  };

  const url = `${apiServer}/cases?folderId=${folderId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error creating case:', error);
    throw error;
  }
}

async function updateCase(jwt: string, updateCaseData: CaseType) {
  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(updateCaseData),
  };

  const url = `${apiServer}/cases/${updateCaseData.id}`;
  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error updating project:', error);
    throw error;
  }
}

async function deleteCases(jwt: string, deleteCaseIds: number[], projectId: number) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ caseIds: deleteCaseIds }),
  };

  const url = `${apiServer}/cases/bulkdelete?projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Error deleting cases:', error);
    throw error;
  }
}

export { fetchCase, fetchCases, updateCase, createCase, deleteCases };
