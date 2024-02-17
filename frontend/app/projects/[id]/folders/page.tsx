"use client";
import { useEffect, useState } from "react";
import Config from "@/config/config";
const apiServer = Config.apiServer;
import { Listbox, ListboxItem } from "@nextui-org/react";
import { FolderIcon } from "@/components/icons";

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

export default function Page({ params }: { params: { id: string } }) {
  const [folders, setFolders] = useState([]);
  const url = `${apiServer}/folders?projectId=${params.id}`;

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

  return (
    <div className="w-64 min-h-screen border-r-1">
      <Listbox aria-label="Listbox Variants">
        {folders.map((folder, index) => (
          <ListboxItem
            key={index}
            startContent={<FolderIcon size={16} className="text-gray-600" />}
          >
            {folder.name}
            {/* {folder.detail}
            {folder.projectId} */}
          </ListboxItem>
        ))}
      </Listbox>
    </div>
  );
}
