import Config from '@/config/config';
import {
  SprintFlow,
  SprintConfig,
  SprintDetectResult,
  SprintDraftFolder,
} from '@/types/project';

const base = Config.apiServer;

export async function detectSprintBranches(jwt: string, automationConfigId: number): Promise<SprintDetectResult> {
  const res = await fetch(`${base}/sprint/detect?automationConfigId=${automationConfigId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function startSprintFlow(
  jwt: string,
  automationConfigId: number,
  title: string,
  baseBranch: string,
  versionBranch: string | null
): Promise<{ flow: SprintFlow; testRunId: number }> {
  const res = await fetch(`${base}/sprint/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ automationConfigId, title, baseBranch, versionBranch }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSprintFlows(jwt: string, automationConfigId: number): Promise<SprintFlow[]> {
  const res = await fetch(`${base}/sprint/flows?automationConfigId=${automationConfigId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSprintFlow(jwt: string, flowId: number): Promise<SprintFlow> {
  const res = await fetch(`${base}/sprint/flows/${flowId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveNodePositions(
  jwt: string,
  flowId: number,
  positions: Record<string, { x: number; y: number }>
): Promise<void> {
  const res = await fetch(`${base}/sprint/flows/${flowId}/positions`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ positions }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function prepareGeneration(jwt: string, flowId: number): Promise<{
  branchNames: string[];
  existingCaseCount: number;
  diffCount: number;
  defaultPrompt: string;
  savedPrompt: string | null;
}> {
  const res = await fetch(`${base}/sprint/flows/${flowId}/generate/prepare`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function streamGeneration(
  jwt: string,
  flowId: number,
  prompt: string,
  onTask: (entry: { task: string; status: string; output: string; durationMs: number }) => void,
  onComplete: (result: { folders: SprintDraftFolder[]; totalCases: number }) => void,
  onError: (msg: string) => void
): () => void {
  const controller = new AbortController();

  fetch(`${base}/sprint/flows/${flowId}/generate/run`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok) {
      onError(await res.text());
      return;
    }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const lines = part.split('\n');
        let event = '';
        let data = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) event = line.slice(7).trim();
          if (line.startsWith('data: ')) data = line.slice(6).trim();
        }
        if (!data) continue;
        try {
          const parsed = JSON.parse(data);
          if (event === 'task') onTask(parsed);
          else if (event === 'complete') onComplete(parsed);
          else if (event === 'error') onError(parsed.message || 'Unknown error');
        } catch (_) {}
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') onError(err.message);
  });

  return () => controller.abort();
}

export async function saveDraft(jwt: string, flowId: number, draft: SprintDraftFolder[]): Promise<void> {
  const res = await fetch(`${base}/sprint/flows/${flowId}/draft`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function approveDraft(
  jwt: string,
  flowId: number,
  draft: SprintDraftFolder[]
): Promise<{ createdCaseIds: number[]; count: number; testRunId: number | null }> {
  const res = await fetch(`${base}/sprint/flows/${flowId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSprintConfig(jwt: string, automationConfigId: number): Promise<SprintConfig> {
  const res = await fetch(`${base}/sprint/config?automationConfigId=${automationConfigId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveSprintConfig(jwt: string, config: SprintConfig): Promise<SprintConfig> {
  const res = await fetch(`${base}/sprint/config`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
