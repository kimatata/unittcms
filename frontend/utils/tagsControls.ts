import { logError } from './errorHandler';
import Config from '@/config/config';
const apiServer = Config.apiServer;

async function fetchTags(jwt: string, projectId: string) {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/tags?projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error: unknown) {
    logError('Error fetching case tags', error);
  }
}

async function createTag(jwt: string, projectId: string, tagName: string) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ name: tagName }),
  };

  const url = `${apiServer}/tags?projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    logError('Error creating case tag', error);
    throw error;
  }
}

async function updateTag(jwt: string, projectId: string, tagId: number, tagName: string) {
  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ name: tagName }),
  };

  const url = `${apiServer}/tags/${tagId}?projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    logError('Error updating case tag', error);
    throw error;
  }
}

async function deleteTag(jwt: string, projectId: string, tagId: number) {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/tags/${tagId}?projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: unknown) {
    logError('Error deleting case tag', error);
    throw error;
  }
}

export { fetchTags, createTag, updateTag, deleteTag };
