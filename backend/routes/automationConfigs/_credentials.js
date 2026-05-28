/**
 * Loads token, instanceUrl, and namespace for a given automation config
 * by looking up the matching integration config (github or gitlab service).
 * Throws a user-facing 422-style error if none is found.
 */
export async function loadProviderCredentials(db, automationConfig) {
  const { provider, projectId } = automationConfig;

  const integration = await db.repos.integrationConfigs.findOne({
    where: { projectId, service: provider },
  });

  if (!integration) {
    const name = provider === 'github' ? 'GitHub' : 'GitLab';
    const err = new Error(
      `No ${name} integration configured. Go to the Integrations tab to add your ${name} token.`
    );
    err.statusCode = 422;
    throw err;
  }

  return {
    token: integration.apiKey,
    instanceUrl:
      integration.settings?.instanceUrl ||
      (provider === 'github' ? 'https://github.com' : 'https://gitlab.com'),
    namespace: integration.settings?.namespace || null,
  };
}
