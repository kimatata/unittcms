import { logError } from './errorHandler';
import { CommentType } from '@/types/comment';
import Config from '@/config/config';
const apiServer = Config.apiServer;

export async function fetchComments(
  jwt: string,
  commentableType: 'RunCase' | 'Run' | 'Case',
  commentableId: number
): Promise<CommentType[]> {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/comments?commentableType=${commentableType}&commentableId=${commentableId}`;
  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error: unknown) {
    logError('Error fetching comments:', error);
    return [];
  }
}

export async function createComment(
  jwt: string,
  commentableType: 'RunCase' | 'Run' | 'Case',
  commentableId: number,
  content: string
): Promise<CommentType | null> {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ content }),
  };

  const url = `${apiServer}/comments/?commentableType=${commentableType}&commentableId=${commentableId}`;
  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data || null;
  } catch (error: unknown) {
    logError('Error creating comments:', error);
    return null;
  }
}

export async function updateComment(jwt: string, commentId: number, content: string): Promise<CommentType | null> {
  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ content }),
  };

  const url = `${apiServer}/comments/${commentId}`;
  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data || null;
  } catch (error: unknown) {
    logError('Error updating comments:', error);
    return null;
  }
}

export async function deleteComment(jwt: string, commentId: number): Promise<void> {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/comments/${commentId}`;
  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    await response.json();
    return;
  } catch (error: unknown) {
    logError('Error deleting comments:', error);
    return;
  }
}
