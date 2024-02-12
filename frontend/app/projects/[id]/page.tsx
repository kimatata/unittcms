"use client";
import { useEffect, useState } from "react";
import Config from "@/config/config";
const apiServer = Config.apiServer;

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
    <div>
      <div>Project: {params.id}</div>
      <div className="flex flex-wrap gap-4 mt-5">
        {folders.map((folder, index) => (
          <div key={index}>
            <div>{folder.name}</div>
            <div>{folder.detail}</div>
            <div>{folder.projectId}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
