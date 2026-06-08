import Config from '@/config/config';
import { SourceCommitType, SyncLogType, TestHealthData } from '@/types/project';

export async function fetchSourceCommits(jwt: string, configId: number): Promise<SourceCommitType[]> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${configId}/source-commits`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function syncSourceCommits(
  jwt: string,
  configId: number
): Promise<{ added: number; autoAnalyzeQueued: string[] }> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${configId}/sync-source-commits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeCommit(
  jwt: string,
  configId: number,
  sha: string
): Promise<{
  sha: string;
  caseNames: string[];
  createdCaseIds: number[];
  filesGenerated: string[];
  testCommitSha: string | null;
  aiSummary: string;
}> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${configId}/analyze-commit/${sha}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSyncLogs(jwt: string, configId: number): Promise<SyncLogType[]> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${configId}/sync-logs`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchTestHealth(jwt: string, configId: number): Promise<TestHealthData> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${configId}/test-health`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateSourceRepoConfig(
  jwt: string,
  configId: number,
  data: {
    sourceRepoOwner: string;
    sourceRepoName: string;
    sourceRepoBranch: string;
    autoAnalyzeCommits: boolean;
    sourceProvider?: string | null;
  }
): Promise<void> {
  const res = await fetch(`${Config.apiServer}/automation-configs/${configId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
}
