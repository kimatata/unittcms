"use client";
import { useEffect, useState } from "react";
import Config from "@/config/config";
const apiServer = Config.apiServer;
import { Button, Listbox, ListboxItem } from "@nextui-org/react";
import { Folder, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const url = `${apiServer}/folders?projectId=${params.projectId}`;

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchFolders(url);
        setFolders(data);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  const router = useRouter();
  return (
    <div className="flex">
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
            >
              {folder.name}
              {/* {folder.detail}
            {folder.projectId} */}
            </ListboxItem>
          ))}
        </Listbox>
      </div>
      <div className="flex-grow">{children}</div>
    </div>
  );
}
