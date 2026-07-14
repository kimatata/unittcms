import { getFilenameFromContentDisposition } from '@/utils/request';
import { logError } from '@/utils/errorHandler';
import Config from '@/config/config';
const apiServer = Config.apiServer;
import { CaseType, ImportPreviewResponse } from '@/types/case';

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

async function fetchCases(
  jwt: string,
  folderId: number,
  search?: string,
  priority?: number[],
  type?: number[],
  tag?: number[]
) {
  const queryParams = [`folderId=${folderId}`];

  if (search) {
    queryParams.push(`search=${search}`);
  }

  if (priority && priority.length > 0) {
    queryParams.push(`priority=${priority.join(',')}`);
  }

  if (type && type.length > 0) {
    queryParams.push(`type=${type.join(',')}`);
  }

  if (tag && tag.length > 0) {
    queryParams.push(`tag=${tag.join(',')}`);
  }

  const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

  const url = `${apiServer}/cases${query}`;

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
    return data || [];
  } catch (error: unknown) {
    logError('Error fetching data', error);
    return [];
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

export async function moveCases(jwt: string, moveCaseIds: number[], targetFolderId: number, projectId: number) {
  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ caseIds: moveCaseIds, targetFolderId }),
  };
  const url = `${apiServer}/cases/move?projectId=${projectId}`;
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

async function cloneCases(jwt: string, moveCaseIds: number[], targetFolderId: number, projectId: number) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ caseIds: moveCaseIds, targetFolderId }),
  };
  const url = `${apiServer}/cases/clone?projectId=${projectId}`;
  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    logError('Error cloning project', error);
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

    const disposition = response.headers.get('content-disposition');
    const filename = getFilenameFromContentDisposition(disposition) ?? `cases.${type}`;

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (error: unknown) {
    logError('Error fetching data', error);
  }
}

async function previewImportCases(jwt: string, folderId: number, file: File): Promise<ImportPreviewResponse> {
  const url = `${apiServer}/cases/import/preview?folderId=${folderId}`;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    logError('Error previewing import', error);
    return { multiSheet: false, sheets: [], error: 'Failed to preview import' };
  }
}

// Import commit runs in the background on the server (large imports can
// exceed a reverse proxy/CDN's request timeout if held open synchronously).
// The initial POST returns a jobId immediately; this polls the status
// endpoint until it's done, so callers see the same { created, updated } /
// { error } shape as before — no caller-side changes needed.
async function commitImportCases(jwt: string, folderId: number, file: File, includedSheetNames: string[]) {
  const url = `${apiServer}/cases/import/commit?folderId=${folderId}`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('includedSheets', JSON.stringify(includedSheetNames));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (response.status !== 202) {
      return data;
    }

    return await pollImportStatus(jwt, data.jobId);
  } catch (error: unknown) {
    logError('Error committing import', error);
    return { error: 'Failed to import cases' };
  }
}

async function pollImportStatus(jwt: string, jobId: string) {
  const url = `${apiServer}/cases/import/status/${jobId}`;
  const pollIntervalMs = 1500;
  const maxAttempts = 200; // ~5 minutes

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await response.json();

      if (data.status === 'completed') {
        return data.result;
      }
      if (data.status === 'failed') {
        return { error: data.error || 'Import failed' };
      }
      // status === 'processing' — keep polling
    } catch (error: unknown) {
      logError('Error polling import status', error);
      return { error: 'Failed to check import status' };
    }
  }

  return { error: 'Import is taking longer than expected. It may still complete in the background — check back later.' };
}

export {
  fetchCase,
  fetchCases,
  updateCase,
  createCase,
  deleteCases,
  cloneCases,
  exportCases,
  previewImportCases,
  commitImportCases,
};
