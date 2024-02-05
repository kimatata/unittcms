"use client";
import { useEffect, useState } from "react";
import { title } from "@/components/primitives";
import { ProjectCard } from "./project-card";
import { Button } from "@nextui-org/react";

import Config from "@/config/config";
const apiServer = Config.apiServer;

/**
 * fetch project records
 *
 * @param {string} url - API endpoint url
 * @returns {Promise<Array>} - project record array
 * @throws {Error}
 */
async function fetchProjects(url) {
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
 *
 * @async
 * @function
 * @throws {Error}
 */
async function createProject() {
  const newProjectData = {
    name: "新しいプロジェクト",
    detail: "新しいプロジェクトの詳細説明がここにくるよ",
  };

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newProjectData),
  };

  const url = `${apiServer}/projects`;
  fetch(url, fetchOptions)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("New project created:", data);
    })
    .catch((error) => {
      console.error("Error creating new project:", error);
    });
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const url = `${apiServer}/projects`;

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchProjects(url);
        setProjects(data);
      } catch (error) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, []);

  return (
    <div>
      <div className="flex h-full items-center">
        <h1 className={title()}>Projects</h1>
        <Button variant="bordered" onClick={createProject} className="ms-5 mt-3">
          Create
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mt-5">
        {projects.map((project, index) => (
          <ProjectCard
            key={index}
            projectName={project.name}
            projectDetail={project.detail}
          />
        ))}
      </div>
    </div>
  );
}
