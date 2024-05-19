'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

type ProjectFolderIds = {
  projectId: number | null;
  folderId: number | null;
};

/**
 * Custom hook that extracts projectId and folderId from the current path.
 * Example: For the path '/projects/1/folders/3/cases', projectId would be 1 and folderId would be 3.
 */
const useGetCurrentIds = (): ProjectFolderIds => {
  const pathname = usePathname();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [folderId, setFolderId] = useState<number | null>(null);

  useEffect(() => {
    const currentPath = pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);

    const projectIdIndex = pathSegments.indexOf('projects') + 1;
    const folderIdIndex = pathSegments.indexOf('folders') + 1;

    const newProjectId = projectIdIndex !== -1 ? parseInt(pathSegments[projectIdIndex], 10) : null;
    const newFolderId = folderIdIndex !== -1 ? parseInt(pathSegments[folderIdIndex], 10) : null;

    setProjectId(newProjectId);
    setFolderId(newFolderId);
  }, [pathname]);

  return {
    projectId,
    folderId,
  };
};

export default useGetCurrentIds;
