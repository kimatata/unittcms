"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useGetCurrentIds from "@/utils/useGetCurrentIds";
import FoldersPane from "./FoldersPane";

export type FolderType = {
  id: number;
  name: string;
  detail: string;
  projectId: number;
  parentFolderId: number | null;
  createdAt: string;
  updatedAt: string;
};

export default function FoldersLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType>({});

  const { folderId } = useGetCurrentIds();

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingProject] = useState<FolderType | null>(null);

  const openDialogForCreate = () => {
    setIsFolderDialogOpen(true);
    setEditingProject(null);
  };

  const closeDialog = () => {
    setIsFolderDialogOpen(false);
    setEditingProject(null);
  };

  const onSubmit = async (name: string, detail: string) => {
    if (editingFolder) {
      const updatedProject = await updateFolder(
        editingFolder.id,
        name,
        detail,
        params.projectId,
        null
      );
      const updatedProjects = folders.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      );
      setFolders(updatedProjects);
    } else {
      const newProject = await createFolder(
        name,
        detail,
        params.projectId,
        null
      );
      setFolders([...folders, newProject]);
    }
    closeDialog();
  };

  const onEditClick = (folder: FolderType) => {
    setEditingProject(folder);
    setIsFolderDialogOpen(true);
  };

  const onDeleteClick = async (folderId: number) => {
    await deleteFolder(folderId);
    router.push(`/projects/${params.projectId}/folders`);
  };

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchFolders(params.projectId);
        setFolders(data);

        const selectedFolderFromUrl = data.find(
          (folder) => folder.id === folderId
        );
        setSelectedFolder(selectedFolderFromUrl);

        // Redirect to the smallest folder ID page if the path is "projects/[projectId]/folders
        if (pathname === `/projects/${params.projectId}/folders`) {
          const smallestFolderId = Math.min(...data.map((folder) => folder.id));
          router.push(
            `/projects/${params.projectId}/folders/${smallestFolderId}/cases`
          );
        }
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, [folderId]);

  return (
    <div className="flex w-full">
      <FoldersPane projectId={params.projectId}/>
      <div className="flex-grow w-full">{children}</div>
    </div>
  );
}
