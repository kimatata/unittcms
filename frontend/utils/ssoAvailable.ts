import Config from '@/config/config';

const apiServer = Config.apiServer;

export async function fetchSSOEnabled() {
  try {
    const res = await fetch(`${apiServer}/users/oidc/enabled`);
    const data = await res.json();

    return data.enabled ?? false;
  } catch (e) {
    console.error('Failed to fetch SSO status', e);
    return false;
  }
}
