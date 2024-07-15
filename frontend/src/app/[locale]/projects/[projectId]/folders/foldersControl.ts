import Config from '@/config/config';
const apiServer = Config.apiServer;

/**
 * fetch folder records
 */
async function fetchFolders(jwt: string, projectId: number) {
  try {
    const url = `${apiServer}/folders?projectId=${projectId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

/**
 * Create project
 */
async function createFolder(
  jwt: string,
  name: string,
  detail: string,
  projectId: string,
  parentFolderId: number | null
) {
  const newFolderData = {
    name: name,
    detail: detail,
    parentFolderId: parentFolderId,
  };

  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(newFolderData),
  };

  const url = `${apiServer}/folders?projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error creating new project:', error);
    throw error;
  }
}

/**
 * Update folder
 */
async function updateFolder(
  jwt: string,
  folderId: number,
  name: string,
  detail: string,
  projectId: string,
  parentFolderId: number | null
) {
  const updateFolderData = {
    name: name,
    detail: detail,
    projectId: projectId,
    parentFolderId: parentFolderId,
  };

  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(updateFolderData),
  };

  const url = `${apiServer}/folders/${folderId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Delete folder
 */
async function deleteFolder(jwt: string, folderId: number) {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/folders/${folderId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

export { fetchFolders, createFolder, updateFolder, deleteFolder };
