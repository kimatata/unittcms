import { logError } from '@/utils/errorHandler';
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
  } catch (error: unknown) {
    logError('Error fetching data', error);
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
  } catch (error: unknown) {
    logError('Error fetching data', error);
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
  } catch (error: unknown) {
    logError('Error creating case', error);
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
  } catch (error: unknown) {
    logError('Error updating project', error);
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
  } catch (error: unknown) {
    logError('Error deleting cases', error);
  }
}

async function exportCases(jwt: string, folderId: number, type: string) {
  if (type !== 'json' && type !== 'csv') {
    console.error('export type error. type:', type);
    return;
  }
  const url = `${apiServer}/cases/download?folderId=${folderId}&type=${type}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `folder_${folderId}.${type}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (error: unknown) {
    logError('Error fetching data', error);
  }
}

export { fetchCase, fetchCases, updateCase, createCase, deleteCases, exportCases };
