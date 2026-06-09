import * as githubActions from './githubActions.js';

const providers = {
  github_actions: githubActions,
};

export function getProvider(providerName) {
  const provider = providers[providerName];
  if (!provider) {
    throw new Error(`Unknown CI provider: "${providerName}". Supported: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}
