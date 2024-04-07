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
import { RunType } from "@/types/run";

type Props = {
  isOpen: boolean;
  editingRun: RunType;
  onCancel: () => void;
  onSubmit: (name: string, detail: string) => void;
};

export default function RunDialog({
  isOpen,
  editingRun,
  onCancel,
  onSubmit,
}: Props) {
  const [runName, setRunName] = useState({
    text: editingRun ? editingRun.name : "",
    isValid: false,
    errorMessage: "",
  });

  const [runDetail, setRunDetail] = useState({
    text: editingRun ? editingRun.detail : "",
    isValid: false,
    errorMessage: "",
  });

  useEffect(() => {
    if (editingRun) {
      setRunName({
        ...runName,
        text: editingRun.name,
      });

      setRunDetail({
        ...runDetail,
        text: editingRun.detail ? editingRun.detail : "",
      });
    } else {
      setRunName({
        ...runName,
        text: "",
      });

      setRunDetail({
        ...runDetail,
        text: "",
      });
    }
  }, [editingRun]);

  const clear = () => {
    setRunName({
      isValid: false,
      text: "",
      errorMessage: "",
    });
    setRunDetail({
      isValid: false,
      text: "",
      errorMessage: "",
    });
  };

  const validate = () => {
    if (!runName.text) {
      setRunName({
        text: "",
        isValid: false,
        errorMessage: "Please enter run name",
      });

      return;
    }

    onSubmit(runName.text, runDetail.text);
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
        <ModalHeader className="flex flex-col gap-1">Run</ModalHeader>
        <ModalBody>
          <Input
            type="text"
            label="Run Name"
            value={runName.text}
            isInvalid={runName.isValid}
            errorMessage={runName.errorMessage}
            onChange={(e) => {
              setRunName({
                ...runName,
                text: e.target.value,
              });
            }}
          />
          <Textarea
            label="Run Detail"
            value={runDetail.text}
            isInvalid={runDetail.isValid}
            errorMessage={runDetail.errorMessage}
            onChange={(e) => {
              setRunDetail({
                ...runDetail,
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
            {editingRun ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
