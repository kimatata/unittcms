export async function ghRequest(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'UnitTCMS',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${text}`);
  return JSON.parse(text);
}

export async function glRequest(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: { 'PRIVATE-TOKEN': token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GitLab ${res.status}: ${text}`);
  return JSON.parse(text);
}

export function inferApiBase(provider, instanceUrl) {
  if (provider === 'github') {
    return instanceUrl.includes('github.com') ? 'https://api.github.com' : `${instanceUrl}/api/v3`;
  }
  return `${instanceUrl}/api/v4`;
}

/**
 * Returns branches for a repo with their last commit info and open PRs.
 * Result: [{ name, sha, lastCommitAuthor, lastCommitAt, ciStatus }]
 */
export async function fetchBranches(provider, apiBase, token, namespace, repoSlug, repoId) {
  const isGitHub = provider === 'github';
  if (isGitHub) {
    const branches = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/branches?per_page=100`, token, null);
    return branches.map((b) => ({
      name: b.name,
      sha: b.commit?.sha || '',
      lastCommitAuthor: b.commit?.commit?.author?.name || null,
      lastCommitAt: b.commit?.commit?.author?.date || null,
    }));
  } else {
    const branches = await glRequest('GET', `${apiBase}/projects/${repoId}/repository/branches?per_page=100`, token, null);
    return branches.map((b) => ({
      name: b.name,
      sha: b.commit?.id || '',
      lastCommitAuthor: b.commit?.author_name || null,
      lastCommitAt: b.commit?.committed_date || null,
    }));
  }
}

/**
 * Returns open PRs for a repo.
 * Result: [{ number, title, sourceBranch, targetBranch, state, ciStatus, url }]
 */
export async function fetchOpenPRs(provider, apiBase, token, namespace, repoSlug, repoId) {
  const isGitHub = provider === 'github';
  if (isGitHub) {
    const prs = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/pulls?state=all&per_page=100`, token, null);
    return prs.map((pr) => ({
      number: pr.number,
      title: pr.title,
      sourceBranch: pr.head?.ref || '',
      targetBranch: pr.base?.ref || '',
      state: pr.merged_at ? 'merged' : pr.state,
      url: pr.html_url,
      author: pr.user?.login || null,
    }));
  } else {
    const mrs = await glRequest('GET', `${apiBase}/projects/${repoId}/merge_requests?state=all&per_page=100`, token, null);
    return mrs.map((mr) => ({
      number: mr.iid,
      title: mr.title,
      sourceBranch: mr.source_branch || '',
      targetBranch: mr.target_branch || '',
      state: mr.state === 'merged' ? 'merged' : mr.state,
      url: mr.web_url,
      author: mr.author?.username || null,
    }));
  }
}

/**
 * Infer ticket ID from branch name using a regex pattern.
 */
export function inferTicketId(branchName, regexStr) {
  if (!regexStr) return null;
  try {
    const match = branchName.match(new RegExp(regexStr, 'i'));
    return match ? match[1] || match[0] : null;
  } catch {
    return null;
  }
}
