import Config from '@/config/config';

const apiServer = Config.apiServer;

export async function fetchSSOEnabled() {
  const res = await fetch(`${apiServer}/users/oidc/enabled`);
  const data = await res.json();

  return data.enabled;
}
