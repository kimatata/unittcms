import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listRuns, listJobsForRun } from './githubActions.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const TOKEN = 'ghp_test';
const OWNER = 'my-org';
const REPO = 'my-repo';
const SINCE = new Date('2026-04-08T00:00:00Z');

describe('listRuns', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized runs for a single page', async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        workflow_runs: [
          {
            id: 123,
            name: 'CI',
            status: 'completed',
            conclusion: 'success',
            head_branch: 'main',
            head_sha: 'abc123',
            triggering_actor: { login: 'eliezer' },
            run_started_at: '2026-05-01T10:00:00Z',
            updated_at: '2026-05-01T10:05:00Z',
          },
        ],
      })
    );

    const runs = await listRuns(TOKEN, OWNER, REPO, SINCE);

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      externalId: '123',
      name: 'CI',
      status: 'completed',
      conclusion: 'success',
      providerStatus: 'completed',
      providerConclusion: 'success',
      branch: 'main',
      commitSha: 'abc123',
      triggeredBy: 'eliezer',
    });
    expect(runs[0].startedAt).toBeInstanceOf(Date);
    expect(runs[0].completedAt).toBeInstanceOf(Date);
  });

  it('paginates until empty page', async () => {
    const page1Runs = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: 'CI',
      status: 'completed',
      conclusion: 'success',
      head_branch: 'main',
      head_sha: `sha${i}`,
      triggering_actor: null,
      run_started_at: '2026-05-01T10:00:00Z',
      updated_at: '2026-05-01T10:05:00Z',
    }));

    mockFetch
      .mockResolvedValueOnce(makeResponse({ workflow_runs: page1Runs }))
      .mockResolvedValueOnce(makeResponse({ workflow_runs: [] }));

    const runs = await listRuns(TOKEN, OWNER, REPO, SINCE);

    expect(runs).toHaveLength(100);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('normalizes GitHub status correctly', async () => {
    const cases = [
      { status: 'queued', conclusion: null, expectedStatus: 'pending', expectedConclusion: null },
      { status: 'in_progress', conclusion: null, expectedStatus: 'running', expectedConclusion: null },
      { status: 'completed', conclusion: 'failure', expectedStatus: 'completed', expectedConclusion: 'failure' },
      { status: 'completed', conclusion: 'timed_out', expectedStatus: 'completed', expectedConclusion: 'failure' },
      { status: 'completed', conclusion: 'neutral', expectedStatus: 'completed', expectedConclusion: 'success' },
      { status: 'completed', conclusion: 'stale', expectedStatus: 'completed', expectedConclusion: 'cancelled' },
    ];

    for (const { status, conclusion, expectedStatus, expectedConclusion } of cases) {
      mockFetch.mockResolvedValueOnce(
        makeResponse({
          workflow_runs: [
            {
              id: 1,
              name: 'CI',
              status,
              conclusion,
              head_branch: 'main',
              head_sha: 'abc',
              triggering_actor: null,
              run_started_at: '2026-05-01T10:00:00Z',
              updated_at: '2026-05-01T10:05:00Z',
            },
          ],
        })
      );

      const runs = await listRuns(TOKEN, OWNER, REPO, SINCE);
      expect(runs[0].status).toBe(expectedStatus);
      expect(runs[0].conclusion).toBe(expectedConclusion);
    }
  });

  it('throws with statusCode 401 on GitHub 401', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 401));
    await expect(listRuns(TOKEN, OWNER, REPO, SINCE)).rejects.toMatchObject({
      statusCode: 401,
      message: expect.stringContaining('authentication failed'),
    });
  });

  it('throws with statusCode 403 on GitHub 403', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 403));
    await expect(listRuns(TOKEN, OWNER, REPO, SINCE)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws with statusCode 429 on GitHub 429', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 429));
    await expect(listRuns(TOKEN, OWNER, REPO, SINCE)).rejects.toMatchObject({
      statusCode: 429,
      message: expect.stringContaining('rate limit'),
    });
  });
});

describe('listJobsForRun', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized jobs', async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        jobs: [
          {
            id: 456,
            name: 'test',
            status: 'completed',
            conclusion: 'success',
            started_at: '2026-05-01T10:00:00Z',
            completed_at: '2026-05-01T10:04:00Z',
          },
        ],
      })
    );

    const jobs = await listJobsForRun(TOKEN, OWNER, REPO, '123');

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      externalId: '456',
      name: 'test',
      status: 'completed',
      conclusion: 'success',
    });
  });

  it('returns empty array when no jobs', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ jobs: [] }));
    const jobs = await listJobsForRun(TOKEN, OWNER, REPO, '123');
    expect(jobs).toHaveLength(0);
  });
});
