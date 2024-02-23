"use client";
import { useEffect, useState } from "react";
import Config from "@/config/config";
const apiServer = Config.apiServer;
import { Button, Listbox, ListboxItem } from "@nextui-org/react";
import { Folder, Plus } from "lucide-react";
import { FolderDialog } from "./folder-dialog";
import FolderEditMenu from "./folder-edit-menu";
import { useRouter } from "next/navigation";
import useGetCurrentIds from "@/utils/useGetCurrentIds";

export type FolderType = {
  id: number;
  name: string;
  detail: string;
  projectId: number;
  parentFolderId: number | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * fetch folder records
 *
 * @param {string} url - API endpoint url
 * @returns {Promise<Array>} - project record array
 * @throws {Error}
 */
async function fetchFolders(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
}

/**
 * Create project
 */
async function createFolder(
  name: string,
  detail: string,
  projectId: number,
  parentFolderId: number
) {
  const newFolderData = {
    name: name,
    detail: detail,
    projectId: projectId,
    parentFolderId: parentFolderId,
  };

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newFolderData),
  };

  const url = `${apiServer}/folders`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating new project:", error);
    throw error;
  }
}

/**
 * Update folder
 */
async function updateFolder(
  folderId: number,
  name: string,
  detail: string,
  projectId: number,
  parentFolderId: number
) {
  const updateFolderData = {
    name: name,
    detail: detail,
    projectId: projectId,
    parentFolderId: parentFolderId,
  };

  const fetchOptions = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
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
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

/**
 * Delete folder
 */
async function deleteFolder(folderId: number) {
  const fetchOptions = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const url = `${apiServer}/folders/${folderId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

export default function FoldersLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: number };
}) {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType>({});

  const url = `${apiServer}/folders?projectId=${params.projectId}`;
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

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchFolders(url);
        setFolders(data);

        const selectedFolderFromUrl = data.find(
          (folder) => folder.id === folderId
        );
        setSelectedFolder(selectedFolderFromUrl);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, [folderId]);

  const router = useRouter();
  return (
    <div className="flex w-full">
      <div className="w-64 min-h-screen border-r-1">
        <Button
          startContent={<Plus size={16} />}
          size="sm"
          variant="bordered"
          className="m-2"
          onClick={openDialogForCreate}
        >
          New Folder
        </Button>
        <Listbox aria-label="Listbox Variants">
          {folders.map((folder, index) => (
            <ListboxItem
              key={index}
              onClick={() =>
                router.push(
                  `/projects/${params.projectId}/folders/${folder.id}/cases`
                )
              }
              startContent={<Folder size={20} color="#99ccff" fill="#99ccff" />}
              className={
                selectedFolder && folder.id === selectedFolder.id
                  ? "bg-gray-300"
                  : ""
              }
              endContent={
                <FolderEditMenu
                  key={index}
                  folder={folder}
                  onEditClick={onEditClick}
                  onDeleteClick={() => console.log("TODO")}
                />
              }
            >
              {folder.name}
            </ListboxItem>
          ))}
        </Listbox>
      </div>
      <div className="flex-grow w-full">
        <h3 className="border-b-1 w-full font-bold p-3">
          {selectedFolder ? selectedFolder.name : "Select Folder"}
        </h3>
        {children}
      </div>

      <FolderDialog
        isOpen={isFolderDialogOpen}
        editingFolder={editingFolder}
        onCancel={closeDialog}
        onSubmit={onSubmit}
      />
    </div>
  );
}
