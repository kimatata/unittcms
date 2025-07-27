import { logError } from '@/utils/errorHandler';
import Config from '@/config/config';
const apiServer = Config.apiServer;

/**
 * fetch projects (public and user own projects)
 */
async function fetchProjects(jwt: string) {
  const url = `${apiServer}/projects`;

  try {
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
  } catch (error: unknown) {
    logError('Error fetching data:', error);
  }
}

/**
 * fetch project
 */
async function fetchProject(jwt: string, projectId: number) {
  const url = `${apiServer}/projects/${projectId}`;

  try {
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
  } catch (error: unknown) {
    logError('Error fetching data:', error);
  }
}

/**
 * fetch projects (user own projects)
 */
async function fetchMyProjects(jwt: string) {
  const url = `${apiServer}/projects?onlyUserProjects=true`;

  try {
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
  } catch (error: unknown) {
    logError('Error fetching data:', error);
  }
}

/**
 * Create project
 */
async function createProject(jwt: string, name: string, detail: string, isPublic: boolean) {
  const newProjectData = {
    name,
    detail,
    isPublic,
  };

  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(newProjectData),
  };

  const url = `${apiServer}/projects`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    logError('Error creating new project:', error);
    throw error;
  }
}

/**
 * Update project
 */
async function updateProject(jwt: string, projectId: number, name: string, detail: string, isPublic: boolean) {
  const updatedProjectData = {
    name,
    detail,
    isPublic,
  };

  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(updatedProjectData),
  };

  const url = `${apiServer}/projects/${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    logError('Error updating project:', error);
    throw error;
  }
}

/**
 * Delete project
 */
async function deleteProject(jwt: string, projectId: number) {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/projects/${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error: unknown) {
    logError('Error deleting project:', error);
    throw error;
  }
}

export { fetchProject, fetchProjects, fetchMyProjects, createProject, updateProject, deleteProject };
