/**
 * @typedef {'pending'|'running'|'completed'} NormalizedStatus
 * @typedef {'success'|'failure'|'cancelled'|'skipped'|null} NormalizedConclusion
 */

/**
 * @typedef {Object} NormalizedRun
 * @property {string} externalId       - Provider's run ID as string
 * @property {string} name             - Workflow name
 * @property {NormalizedStatus} status
 * @property {NormalizedConclusion} conclusion
 * @property {string} providerStatus   - Raw status from provider (for debug)
 * @property {string|null} providerConclusion - Raw conclusion from provider (for debug)
 * @property {string} branch
 * @property {string} commitSha
 * @property {string|null} triggeredBy
 * @property {Date|null} startedAt
 * @property {Date|null} completedAt
 */

/**
 * @typedef {Object} NormalizedJob
 * @property {string} externalId
 * @property {string} name
 * @property {NormalizedStatus} status
 * @property {NormalizedConclusion} conclusion
 * @property {string} providerStatus
 * @property {string|null} providerConclusion
 * @property {Date|null} startedAt
 * @property {Date|null} completedAt
 */

/**
 * CI Provider contract. Every provider module must export these two functions.
 *
 * @typedef {Object} CiProvider
 * @property {(token: string, repoOwner: string, repoName: string, since: Date) => Promise<NormalizedRun[]>} listRuns
 * @property {(token: string, repoOwner: string, repoName: string, runExternalId: string) => Promise<NormalizedJob[]>} listJobsForRun
 */
