import { logError } from '@/utils/errorHandler';
import Config from '@/config/config';
const apiServer = Config.apiServer;

async function fetchProjectMembers(jwt: string, projectId: string) {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/members?projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    logError('Error fetching data:', error);
  }
}

async function addMember(jwt: string, userId: number, projectId: number) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/members?userId=${userId}&projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    logError('Error fetching data:', error);
  }
}

async function deleteMember(jwt: string, userId: number, projectId: number) {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/members?userId=${userId}&projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: unknown) {
    logError('Error fetching data:', error);
  }
}

async function updateMember(jwt: string, userId: number, projectId: number, role: number) {
  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/members?userId=${userId}&projectId=${projectId}&role=${role}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    logError('Error fetching data:', error);
  }
}

export { fetchProjectMembers, addMember, deleteMember, updateMember };
