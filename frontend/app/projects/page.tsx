"use client";
import { title } from "@/components/primitives";
import { ProjectCard } from "./project-card";
import { Button } from "@nextui-org/react";

const projects = [
  {
    name: "Robot1",
    detail: "Embeded system test",
  },
  {
    name: "Battle-tested in Production",
    detail: "All the features you need for production: hybrid static & server rendering, TypeScript support, smart bundling, route pre-fetching, and more.",
  },
  {
    name: "bank front",
    detail: "web frontend application for abc bank",
  },
  {
    name: "bank API",
    detail: "api server code for abc bank",
  },
  {
    name: "Battle-tested in Production",
    detail: "All the features you need for production: hybrid static & server rendering, TypeScript support, smart bundling, route pre-fetching, and more.",
  },
];

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

  fetch("http://localhost:3001/projects", fetchOptions)
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
  return (
    <div>
      <h1 className={title()}>Projects</h1>
      <Button color="primary" onClick={createProject}>Create</Button>
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
