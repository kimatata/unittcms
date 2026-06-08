import Config from '@/config/config';
import { AutomationConfigType } from '@/types/project';
import { logError } from '@/utils/errorHandler';

const configCache = new Map<number, AutomationConfigType | null>();

export function setAutomationConfigCache(projectId: number, config: AutomationConfigType | null) {
  configCache.set(projectId, config);
}

export async function fetchAutomationConfig(jwt: string, projectId: number): Promise<AutomationConfigType | null> {
  if (configCache.has(projectId)) {
    return configCache.get(projectId) ?? null;
  }
  try {
    const res = await fetch(`${Config.apiServer}/automation-configs/project/${projectId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (res.status === 404) {
      configCache.set(projectId, null);
      return null;
    }
    if (!res.ok) throw new Error(await res.text());
    const data: AutomationConfigType = await res.json();
    configCache.set(projectId, data);
    return data;
  } catch (error) {
    logError('fetchAutomationConfig', error);
    return null;
  }
}

export type RepoItem = {
  id: number;
  name: string;
  fullName: string;
  url: string;
  isPrivate: boolean;
  description: string | null;
};

export async function listRepos(
  jwt: string,
  projectId: number,
  service: 'github' | 'gitlab'
): Promise<RepoItem[]> {
  const res = await fetch(
    `${Config.apiServer}/integration-configs/list-repos?projectId=${projectId}&service=${service}`,
    { headers: { Authorization: `Bearer ${jwt}` } }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createAutomationConfig(
  jwt: string,
  data: {
    projectId: number;
    provider: string;
    repoName: string;
    automationTool: string;
    automationLanguage: string;
    repoUrl?: string;
    repoId?: number;
  }
): Promise<AutomationConfigType> {
  const res = await fetch(`${Config.apiServer}/automation-configs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateAutomationConfig(
  jwt: string,
  id: number,
  data: {
    provider?: string;
    repoName?: string;
    automationTool?: string;
    automationLanguage?: string;
    repoUrl?: string | null;
    repoId?: number | null;
    sourceProvider?: string | null;
  }
): Promise<AutomationConfigType> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function generateAutomationProject(jwt: string, id: number): Promise<AutomationConfigType> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${id}/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type TriggerOptions = {
  mode: 'all' | 'specific' | 'testRun';
  caseIds?: number[];
  runId?: number;
};

export async function triggerAutomationRun(jwt: string, id: number, options: TriggerOptions = { mode: 'all' }): Promise<void> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${id}/trigger`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });
  if (!res.ok) throw new Error(await res.text());
}

export type RunStatus = {
  status: 'queued' | 'in_progress' | 'completed' | null;
  conclusion: 'success' | 'failure' | 'cancelled' | null;
  url: string | null;
  runAt: string | null;
  commitSha: string | null;
};

export async function repairAutomationProject(jwt: string, id: number): Promise<void> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${id}/repair`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function fetchRunStatus(jwt: string, id: number): Promise<RunStatus> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${id}/run-status`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) {
    const err = new Error(await res.text()) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export type RunError = {
  id: string;
  jobId: number;
  jobName: string;
  testName: string;
  filePath: string | null;
  errorText: string;
};

export async function fetchRunErrors(jwt: string, id: number): Promise<RunError[]> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${id}/run-errors`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fixRunError(
  jwt: string,
  id: number,
  error: RunError
): Promise<{ commitUrl: string | null }> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${id}/fix-error`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filePath: error.filePath,
      testName: error.testName,
      errorText: error.errorText,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteAutomationRepo(jwt: string, id: number): Promise<AutomationConfigType> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${id}/repo`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateAutoFixEnabled(jwt: string, id: number, autoFixEnabled: boolean): Promise<AutomationConfigType> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ autoFixEnabled }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type ImplementedCase = {
  id: number;
  title: string;
  folderId: number;
  folderPath: string;
  tags: string[];
  codeFilePath: string | null;
  codeLastSyncAt: string | null;
  codeCommitSha: string | null;
};

export async function fetchImplementedCases(
  jwt: string,
  configId: number
): Promise<{ cases: ImplementedCase[]; totalCases: number }> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${configId}/implemented-cases`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type ProjectRun = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
};

export async function fetchProjectRuns(jwt: string, configId: number): Promise<ProjectRun[]> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${configId}/project-runs`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type SyncResult = {
  addedToTestPlan: number;
  addedToCode: number;
  updatedStatus: number;
  taggedAutomated: number;
  commitUrl: string | null;
};

export async function syncTests(jwt: string, configId: number): Promise<SyncResult> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${configId}/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
