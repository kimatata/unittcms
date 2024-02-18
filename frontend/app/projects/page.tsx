"use client";
import { useEffect, useState } from "react";
import { title } from "@/components/primitives";
import { ProjectCard } from "./project-card";
import { ProjectDialog } from "./project-dialog";
import { Button } from "@nextui-org/react";

import Config from "@/config/config";
const apiServer = Config.apiServer;

export type ProjectType = {
  id: number;
  name: string;
  detail: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * fetch project records
 *
 * @param {string} url - API endpoint url
 * @returns {Promise<Array>} - project record array
 * @throws {Error}
 */
async function fetchProjects(url: string) {
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
async function createProject(name: string, detail: string) {
  const newProjectData = {
    name: name,
    detail: detail,
  };

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newProjectData),
  };

  const url = `${apiServer}/projects`;

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
 * Update project
 */
async function updateProject(projectId: number, name: string, detail: string) {
  const updatedProjectData = {
    name: name,
    detail: detail,
  };

  const fetchOptions = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedProjectData),
  };

  const url = `${apiServer}/projects/${projectId}`;

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
 * Delete project
 */
async function deleteProject(projectId: number) {
  const fetchOptions = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const url = `${apiServer}/projects/${projectId}`;

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

export default function ProjectsPage() {
  // projects
  const [projects, setProjects] = useState([]);
  const url = `${apiServer}/projects`;

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchProjects(url);
        setProjects(data);
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  // dialog
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectType | null>(
    null
  );
  const openDialogForCreate = () => {
    setIsProjectDialogOpen(true);
    setEditingProject(null);
  };

  const closeDialog = () => {
    setIsProjectDialogOpen(false);
    setEditingProject(null);
  };

  const onSubmit = async (name: string, detail: string) => {
    if (editingProject) {
      const updatedProject = await updateProject(
        editingProject.id,
        name,
        detail
      );
      const updatedProjects = projects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      );
      setProjects(updatedProjects);
    } else {
      const newProject = await createProject(name, detail);
      setProjects([...projects, newProject]);
    }
    closeDialog();
  };

  const onEditClicked = (project: ProjectType) => {
    setEditingProject(project);
    setIsProjectDialogOpen(true);
  };

  const onDeleteClicked = async (projectId: number) => {
    try {
      await deleteProject(projectId);
      setProjects(projects.filter((project) => project.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
      <div className="flex h-full items-center">
        <h1 className={title()}>Projects</h1>
        <Button
          color="primary"
          onClick={openDialogForCreate}
          className="ms-5 mt-3"
        >
          Create
        </Button>
      </div>

      <div className="flex flex-wrap items-stretch gap-4 mt-5">
        {projects.map((project, index) => (
          <ProjectCard
            key={index}
            project={project}
            onEditClicked={onEditClicked}
            onDeleteClicked={onDeleteClicked}
          />
        ))}
      </div>

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        editingProject={editingProject}
        onCancel={closeDialog}
        onSubmit={onSubmit}
      />
    </div>
  );
}
