import Config from '@/config/config';

function getAbsoluteApiServer() {
  const apiServer = Config.apiServer;
  // In SSR (server components), relative URLs like '/api' fail with fetch().
  // Use FRONTEND_ORIGIN or fallback to localhost to build an absolute URL.
  if (typeof window === 'undefined' && apiServer.startsWith('/')) {
    const origin = process.env.FRONTEND_ORIGIN || `http://localhost:${process.env.PORT || 8000}`;
    return `${origin}${apiServer}`;
  }
  return apiServer;
}

export async function fetchSSOEnabled() {
  try {
    const res = await fetch(`${getAbsoluteApiServer()}/users/oidc/enabled`);
    const data = await res.json();
    return data.enabled;
  } catch {
    // OIDC not configured or backend unreachable during SSR — default to disabled
    return false;
  }
}
