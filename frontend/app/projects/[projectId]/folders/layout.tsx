"use client";
import { useEffect, useState } from "react";
import Config from "@/config/config";
const apiServer = Config.apiServer;
import { Button, Listbox, ListboxItem } from "@nextui-org/react";
import { Folder, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import useGetCurrentIds from "@/utils/useGetCurrentIds";

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

export default function ProjectsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState({
    id: null,
    name: "",
  });
  const url = `${apiServer}/folders?projectId=${params.projectId}`;
  const { folderId } = useGetCurrentIds();

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
            >
              {folder.name}
            </ListboxItem>
          ))}
        </Listbox>
      </div>
      <div className="flex-grow w-full">
        <h3 className="border-b-1 w-full font-bold p-3">{selectedFolder ? selectedFolder.name : "Select Folder"}</h3>
        {children}
      </div>
    </div>
  );
}
