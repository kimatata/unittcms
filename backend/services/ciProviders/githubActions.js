const GITHUB_API_BASE = 'https://api.github.com';

async function githubFetchBinary(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    redirect: 'follow',
  });

  if (res.status === 401) {
    const err = new Error('GitHub authentication failed. Check the access token.');
    err.statusCode = 401;
    throw err;
  }
  if (res.status === 403) {
    const err = new Error('GitHub access denied. The token may lack required permissions.');
    err.statusCode = 403;
    throw err;
  }
  if (res.status === 429) {
    const err = new Error('GitHub API rate limit exceeded. Try again later.');
    err.statusCode = 429;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`GitHub API error: ${res.status}`);
    err.statusCode = res.status;
    throw err;
  }

  return Buffer.from(await res.arrayBuffer());
}

const STATUS_MAP = {
  in_progress: 'running',
  completed: 'completed',
};

const CONCLUSION_MAP = {
  success: 'success',
  failure: 'failure',
  cancelled: 'cancelled',
  skipped: 'skipped',
  timed_out: 'failure',
  action_required: 'failure',
  neutral: 'success',
  stale: 'cancelled',
};

function normalizeStatus(providerStatus) {
  return STATUS_MAP[providerStatus] ?? 'pending';
}

function normalizeConclusion(providerConclusion) {
  if (!providerConclusion) return null;
  return CONCLUSION_MAP[providerConclusion] ?? null;
}

async function githubFetch(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (res.status === 401) {
    const err = new Error('GitHub authentication failed. Check the access token.');
    err.statusCode = 401;
    throw err;
  }
  if (res.status === 403) {
    const err = new Error('GitHub access denied. The token may lack required permissions.');
    err.statusCode = 403;
    throw err;
  }
  if (res.status === 429) {
    const err = new Error('GitHub API rate limit exceeded. Try again later.');
    err.statusCode = 429;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`GitHub API error: ${res.status}`);
    err.statusCode = res.status;
    throw err;
  }

  return res.json();
}

export async function listRuns(token, repoOwner, repoName, since) {
  const sinceDate = since.toISOString().split('T')[0];
  const runs = [];
  let page = 1;

  while (true) {
    const url = `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/actions/runs?created=>=${sinceDate}&per_page=100&page=${page}`;
    const data = await githubFetch(url, token);

    if (!data.workflow_runs || data.workflow_runs.length === 0) break;

    for (const run of data.workflow_runs) {
      runs.push({
        externalId: String(run.id),
        name: run.name,
        status: normalizeStatus(run.status),
        conclusion: normalizeConclusion(run.conclusion),
        providerStatus: run.status,
        providerConclusion: run.conclusion ?? null,
        branch: run.head_branch,
        commitSha: run.head_sha,
        triggeredBy: run.triggering_actor?.login ?? null,
        startedAt: run.run_started_at ? new Date(run.run_started_at) : null,
        completedAt: run.status === 'completed' && run.updated_at ? new Date(run.updated_at) : null,
      });
    }

    if (data.workflow_runs.length < 100) break;
    page++;
  }

  return runs;
}

export async function listJobsForRun(token, repoOwner, repoName, runExternalId) {
  const jobs = [];
  let page = 1;

  while (true) {
    const url = `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/actions/runs/${runExternalId}/jobs?per_page=100&page=${page}`;
    const data = await githubFetch(url, token);

    if (!data.jobs || data.jobs.length === 0) break;

    for (const job of data.jobs) {
      jobs.push({
        externalId: String(job.id),
        name: job.name,
        status: normalizeStatus(job.status),
        conclusion: normalizeConclusion(job.conclusion),
        providerStatus: job.status,
        providerConclusion: job.conclusion ?? null,
        startedAt: job.started_at ? new Date(job.started_at) : null,
        completedAt: job.completed_at ? new Date(job.completed_at) : null,
      });
    }

    if (data.jobs.length < 100) break;
    page++;
  }

  return jobs;
}

export async function downloadRunArtifacts(token, repoOwner, repoName, runExternalId) {
  const url = `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/actions/runs/${runExternalId}/artifacts`;
  const data = await githubFetch(url, token);

  if (!data.artifacts || data.artifacts.length === 0) return [];

  const buffers = [];
  for (const artifact of data.artifacts) {
    const zipUrl = `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/actions/artifacts/${artifact.id}/zip`;
    const buffer = await githubFetchBinary(zipUrl, token);
    buffers.push(buffer);
  }

  return buffers;
}
