import { logError } from './errorHandler';
import Config from '@/config/config';
import { InvitationPreviewType, InvitationType } from '@/types/invitation';

const apiServer = Config.apiServer;

function headers(jwt?: string) {
  return {
    'Content-Type': 'application/json',
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  };
}

async function fetchInvitations(jwt: string, projectId: string): Promise<InvitationType[]> {
  try {
    const response = await fetch(`${apiServer}/invitations?projectId=${projectId}`, {
      method: 'GET',
      headers: headers(jwt),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return (await response.json()) || [];
  } catch (error: unknown) {
    logError('Error fetching invitations', error);
    return [];
  }
}

async function createInvitation(jwt: string, projectId: string, role: number, email: string | null) {
  try {
    const response = await fetch(`${apiServer}/invitations?projectId=${projectId}`, {
      method: 'POST',
      headers: headers(jwt),
      body: JSON.stringify({ role, email }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error: unknown) {
    logError('Error creating invitation', error);
    throw error;
  }
}

async function revokeInvitation(jwt: string, projectId: string, invitationId: number) {
  try {
    const response = await fetch(`${apiServer}/invitations/${invitationId}?projectId=${projectId}`, {
      method: 'DELETE',
      headers: headers(jwt),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: unknown) {
    logError('Error revoking invitation', error);
    throw error;
  }
}

/** Lecture publique : l'invité n'a pas encore de compte. */
async function fetchInvitationPreview(token: string): Promise<InvitationPreviewType | null> {
  try {
    const response = await fetch(`${apiServer}/invitations/${token}`, { method: 'GET', headers: headers() });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error: unknown) {
    logError('Error fetching invitation', error);
    return null;
  }
}

async function acceptInvitation(
  token: string,
  jwt: string | null,
  account?: { email: string; username: string; password: string }
) {
  const response = await fetch(`${apiServer}/invitations/${token}/accept`, {
    method: 'POST',
    headers: headers(jwt ?? undefined),
    body: JSON.stringify(account ?? {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! Status: ${response.status}`);
  }
  return data;
}

export { fetchInvitations, createInvitation, revokeInvitation, fetchInvitationPreview, acceptInvitation };
