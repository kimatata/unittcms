import { ProjectRoleType, TokenType } from '@/types/user';
import { roles, memberRoles } from '@/config/selection';
import Config from '@/config/config';
const apiServer = Config.apiServer;

function tokenExists(token: TokenType) {
  if (token && token.user && token.user.username) {
    return true;
  } else {
    return false;
  }
}

function isTokenValid(token: TokenType) {
  if (Date.now() < token.expires_at) {
    return true;
  } else {
    return false;
  }
}

function isSignedIn(token: TokenType): boolean {
  if (tokenExists(token) && isTokenValid(token)) {
    return true;
  } else {
    return false;
  }
}

function isAdmin(token: TokenType) {
  if (tokenExists(token) && isTokenValid(token)) {
    const adminRoleIndex = roles.findIndex((entry) => entry.uid === 'administrator');
    if (token.user && token.user.role === adminRoleIndex) {
      return true;
    }
  }

  return false;
}

async function fetchMyRoles(jwt: string) {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/members/check`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

function isProjectOnwer(projectRoles: ProjectRoleType[], projectId: number) {
  if (!projectRoles) {
    return false;
  }

  const found = projectRoles.find((role) => {
    return role.projectId === projectId;
  });

  if (!found) {
    return false;
  }

  if (found.isOwner === true) {
    return true;
  }

  return false;
}

function isProjectManager(projectRoles: ProjectRoleType[], projectId: number) {
  if (!projectRoles) {
    return false;
  }

  const found = projectRoles.find((role) => {
    return role.projectId === projectId;
  });

  if (!found) {
    return false;
  }

  if (found.isOwner === true) {
    return true;
  }

  const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'manager');
  if (found.role === managerRoleIndex) {
    return true;
  }

  return false;
}

function isProjectDeveloper(projectRoles: ProjectRoleType[], projectId: number) {
  if (!projectRoles) {
    return false;
  }

  const found = projectRoles.find((role) => {
    return role.projectId === projectId;
  });

  if (!found) {
    return false;
  }

  if (found.isOwner === true) {
    return true;
  }

  const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'manager');
  const developerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'developer');
  if (found.role === managerRoleIndex || found.role === developerRoleIndex) {
    return true;
  }

  return false;
}

function isProjectReporter(projectRoles: ProjectRoleType[], projectId: number) {
  if (!projectRoles) {
    return false;
  }

  const found = projectRoles.find((role) => {
    return role.projectId === projectId;
  });

  if (!found) {
    return false;
  }

  if (found.isOwner === true) {
    return true;
  }

  const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'manager');
  const developerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'developer');
  const reporterRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'reporter');
  if (found.role === managerRoleIndex || found.role === developerRoleIndex || found.role === reporterRoleIndex) {
    return true;
  }

  return false;
}

// private paths are '/account', '/admin', '/projects/*'
const isPrivatePath = (pathname: string) => {
  return /^\/account(\/)?$/.test(pathname) || /^\/admin(\/.*)?$/.test(pathname) || /^\/projects(\/.*)?$/.test(pathname);
};

function checkSignInPage(token: TokenType, pathname: string) {
  let ret = {
    ok: true,
    reason: '',
    redirectPath: '',
  };

  if (isPrivatePath(pathname) && !isSignedIn(token)) {
    if (!tokenExists(token)) {
      ret.ok = false;
      ret.reason = 'notoken';
      ret.redirectPath = '/account/signin';
      return ret;
    }
    if (!isTokenValid(token)) {
      ret.ok = false;
      ret.reason = 'expired';
      ret.redirectPath = '/account/signin';
      return ret;
    }
  }

  return ret;
}

export {
  isSignedIn,
  isAdmin,
  isProjectOnwer,
  isProjectManager,
  isProjectDeveloper,
  isProjectReporter,
  isPrivatePath,
  checkSignInPage,
  fetchMyRoles,
};
