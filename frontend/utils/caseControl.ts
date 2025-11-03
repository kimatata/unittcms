import { logError } from '@/utils/errorHandler';
import Config from '@/config/config';
const apiServer = Config.apiServer;
import { CaseType } from '@/types/case';
import { testRunStatus, priorities, testTypes, automationStatus, templates } from '@/config/selection';
import { RunStatusMessages } from '@/types/status';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';

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

async function fetchCases(jwt: string, folderId: number, title?: string, priority?: number[], type?: number[]) {
  const queryParams = [`folderId=${folderId}`];

  if (title) {
    queryParams.push(`title=${title}`);
  }

  if (priority && priority.length > 0) {
    queryParams.push(`priority=${priority.join(',')}`);
  }

  if (type && type.length > 0) {
    queryParams.push(`type=${type.join(',')}`);
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

async function exportCases(
  jwt: string,
  folderId: number,
  type: string,
  runStatusMessages?: RunStatusMessages,
  priorityMessages?: PriorityMessages,
  testTypeMessages?: TestTypeMessages
) {
  if (type !== 'json' && type !== 'csv') {
    console.error('export type error. type:', type);
    return;
  }

  // For CSV, fetch JSON data and generate CSV client-side with localized labels
  if (type === 'csv') {
    try {
      const url = `${apiServer}/cases/download?folderId=${folderId}&type=json`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const cases = await response.json();

      // Convert numeric values to localized labels
      const records = cases.map((c: CaseType) => ({
        id: c.id,
        title: c.title,
        state: runStatusMessages && testRunStatus[c.state]
          ? runStatusMessages[testRunStatus[c.state].uid]
          : testRunStatus[c.state]?.uid || c.state,
        priority: priorityMessages && priorities[c.priority]
          ? priorityMessages[priorities[c.priority].uid]
          : priorities[c.priority]?.uid || c.priority,
        type: testTypeMessages && testTypes[c.type]
          ? testTypeMessages[testTypes[c.type].uid]
          : testTypes[c.type]?.uid || c.type,
        automationStatus: automationStatus[c.automationStatus]?.uid || c.automationStatus,
        description: c.description,
        template: templates[c.template]?.uid || c.template,
        preConditions: c.preConditions,
        expectedResults: c.expectedResults,
        folderId: c.folderId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      // Generate CSV
      if (records.length === 0) {
        console.warn('No records to export');
        return;
      }

      const headers = Object.keys(records[0]);
      const csvRows = [
        headers.join(','),
        ...records.map((row: Record<string, string | number>) =>
          headers.map((header) => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        ),
      ];
      const csvContent = csvRows.join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `folder_${folderId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error: unknown) {
      logError('Error exporting CSV:', error);
    }
    return;
  }

  // For JSON, use backend endpoint
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

export { fetchCase, fetchCases, updateCase, createCase, deleteCases, cloneCases, exportCases };
