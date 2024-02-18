"use client";
import React from "react";
import { useState } from "react";
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
import { ProjectType } from "./page";

type Props = {
  isOpen: boolean;
  editingProject: ProjectType;
  onCancel: () => void;
  onSubmit: (name: string, detail: string) => void;
};

export function ProjectDialog({
  isOpen,
  editingProject,
  onCancel,
  onSubmit,
}: Props) {
  const [projectName, setProjectName] = useState({
    text: editingProject ? editingProject.name : "",
    isValid: false,
    errorMessage: "",
  });

  const [projectDetail, setProjectDetail] = useState({
    text: editingProject ? editingProject.detail : "",
    isValid: false,
    errorMessage: "",
  });

  const clear = () => {
    setProjectName({
      isValid: false,
      text: "",
      errorMessage: "",
    });
    setProjectDetail({
      isValid: false,
      text: "",
      errorMessage: "",
    });
  };

  const validate = () => {
    if (!projectName.text) {
      setProjectName({
        text: "",
        isValid: false,
        errorMessage: "Please enter project name",
      });

      return;
    }

    onSubmit(projectName.text, projectDetail.text);
    clear();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        onCancel();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Project</ModalHeader>
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
          <Button variant="light" onPress={onCancel}>
            Close
          </Button>
          <Button color="primary" onPress={validate}>
            {editingProject ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
