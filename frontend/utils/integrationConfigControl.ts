import Config from '@/config/config';
import { IntegrationConfigType } from '@/types/integrations';
import { logError } from '@/utils/errorHandler';

export async function fetchIntegrationConfigs(jwt: string, projectId: number): Promise<IntegrationConfigType[]> {
  try {
    const res = await fetch(`${Config.apiServer}/integration-configs/project/${projectId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    logError('fetchIntegrationConfigs', error);
    return [];
  }
}

export async function upsertIntegrationConfig(
  jwt: string,
  projectId: number,
  service: string,
  apiKey: string,
  settings?: Record<string, string>
): Promise<IntegrationConfigType> {
  const res = await fetch(`${Config.apiServer}/integration-configs/upsert`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId, service, apiKey, settings }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteIntegrationConfig(jwt: string, id: number): Promise<void> {
  const res = await fetch(`${Config.apiServer}/integration-configs/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
}
