import { title } from "@/components/primitives";
import { ProjectCard } from "./project-card";

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

export default function ProjectsPage() {
  return (
    <div>
      <h1 className={title()}>Projects</h1>
      <div className="flex flex-wrap gap-4 mt-5">
        {projects.map((project) => (
          <ProjectCard
            projectName={project.name}
            projectDetail={project.detail}
          />
        ))}
      </div>
    </div>
  );
}
