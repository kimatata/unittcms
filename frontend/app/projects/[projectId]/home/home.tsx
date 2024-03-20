"use client";
import Config from "@/config/config";
const apiServer = Config.apiServer;
import { useState, useEffect } from "react";

async function fetchProject(url) {
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

type Props = {
  projectId: string;
};

export function Home({ projectId }: Props) {
  const [project, setProject] = useState({
    Folders: [],
  });
  const url = `${apiServer}/projects/${projectId}`;

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchProject(url);
        setProject(data);
        console.log(data);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, [url]);

  return (
    <>
      <h3 className="font-bold ms-2">Home</h3>

      <h4 className="font-bold ms-2 mt-5">
        Folder num: {project.Folders.length}
      </h4>
    </>
  );
}
