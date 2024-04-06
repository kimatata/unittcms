"use client";
import React from "react";
import { useState, useEffect } from "react";
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
import { FolderType } from "@/types/folder";

type Props = {
  isOpen: boolean;
  editingFolder: FolderType;
  onCancel: () => void;
  onSubmit: (name: string, detail: string) => void;
};

export default function FolderDialog({
  isOpen,
  editingFolder,
  onCancel,
  onSubmit,
}: Props) {
  const [folderName, setFolderName] = useState({
    text: editingFolder ? editingFolder.name : "",
    isValid: false,
    errorMessage: "",
  });

  const [folderDetail, setFolderDetail] = useState({
    text: editingFolder ? editingFolder.detail : "",
    isValid: false,
    errorMessage: "",
  });

  useEffect(() => {
    if (editingFolder) {
      setFolderName({
        ...folderName,
        text: editingFolder.name,
      });

      setFolderDetail({
        ...folderDetail,
        text: editingFolder.detail ? editingFolder.detail : "",
      });
    } else {
      setFolderName({
        ...folderName,
        text: "",
      });

      setFolderDetail({
        ...folderDetail,
        text: "",
      });
    }
  }, [editingFolder]);

  const clear = () => {
    setFolderName({
      isValid: false,
      text: "",
      errorMessage: "",
    });
    setFolderDetail({
      isValid: false,
      text: "",
      errorMessage: "",
    });
  };

  const validate = () => {
    if (!folderName.text) {
      setFolderName({
        text: "",
        isValid: false,
        errorMessage: "Please enter folder name",
      });

      return;
    }

    onSubmit(folderName.text, folderDetail.text);
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
        <ModalHeader className="flex flex-col gap-1">Folder</ModalHeader>
        <ModalBody>
          <Input
            type="text"
            label="Folder Name"
            value={folderName.text}
            isInvalid={folderName.isValid}
            errorMessage={folderName.errorMessage}
            onChange={(e) => {
              setFolderName({
                ...folderName,
                text: e.target.value,
              });
            }}
          />
          <Textarea
            label="Folder Detail"
            value={folderDetail.text}
            isInvalid={folderDetail.isValid}
            errorMessage={folderDetail.errorMessage}
            onChange={(e) => {
              setFolderDetail({
                ...folderDetail,
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
            {editingFolder ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
