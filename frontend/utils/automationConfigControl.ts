import Config from '@/config/config';
import { AutomationConfigType } from '@/types/project';
import { logError } from '@/utils/errorHandler';

export async function fetchAutomationConfig(jwt: string, projectId: number): Promise<AutomationConfigType | null> {
  try {
    const res = await fetch(`${Config.apiServer}/automation-configs/project/${projectId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    logError('fetchAutomationConfig', error);
    return null;
  }
}

export async function createAutomationConfig(
  jwt: string,
  data: {
    projectId: number;
    provider: string;
    gitlabUrl: string;
    gitlabToken: string;
    gitlabNamespace: string;
    repoName: string;
    automationTool: string;
    automationLanguage: string;
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
    provider: string;
    gitlabUrl: string;
    gitlabToken: string;
    gitlabNamespace: string;
    repoName: string;
    automationTool: string;
    automationLanguage: string;
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
