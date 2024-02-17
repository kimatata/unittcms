"use client";
import { useEffect, useState } from "react";
import { title } from "@/components/primitives";
import { ProjectCard } from "./project-card";
import {
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";

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
async function createProject(name, detail) {
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

  // new project data
  const [projectName, setProjectName] = useState({
    text: "",
    isValid: false,
    errorMessage: "",
  });
  const [projectDetail, setProjectDetail] = useState({
    text: "",
    isValid: false,
    errorMessage: "",
  });

  // modal
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const openModal = () => {
    setIsCreateDialogOpen(true);
  };

  const closeModal = () => {
    setProjectName({ text: "", isValid: false, errorMessage: "" });
    setProjectDetail({ text: "", isValid: false, errorMessage: "" });
    setIsCreateDialogOpen(false);
  };

  const onCreateClicked = async () => {
    let isValid = true;

    // validate projectName
    if (!projectName.text) {
      setProjectName({
        text: "",
        isValid: false,
        errorMessage: "Please enter project name",
      });
      isValid = false;
    }

    if (isValid) {
      const newProject = await createProject(
        projectName.text,
        projectDetail.text
      );
      setProjects([...projects, newProject]);
      closeModal();
    }
  };

  return (
    <div className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
      <div className="flex h-full items-center">
        <h1 className={title()}>Projects</h1>
        <Button color="primary" onClick={openModal} className="ms-5 mt-3">
          Create
        </Button>
      </div>

      <div className="flex flex-wrap items-stretch gap-4 mt-5">
        {projects.map((project, index) => (
          <ProjectCard
            key={index}
            projectName={project.name}
            projectDetail={project.detail}
          />
        ))}
      </div>

      <Modal isOpen={isCreateDialogOpen}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
          <ModalBody>
            <Input
              type="text"
              label="Project Name"
              value={projectName.text}
              isInvalid={projectName.isValid}
              errorMessage={projectName.errorMessage}
              onChange={(e) => {
                setProjectName({
                  ...projectName,
                  text: e.target.value,
                });
              }}
            />
            <Textarea
              label="Project Detail"
              value={projectDetail.text}
              isInvalid={projectDetail.isValid}
              errorMessage={projectDetail.errorMessage}
              onChange={(e) => {
                setProjectDetail({
                  ...projectDetail,
                  text: e.target.value,
                });
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={closeModal}>
              Close
            </Button>
            <Button color="primary" onPress={onCreateClicked}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
