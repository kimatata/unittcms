"use client";
import React from "react";
import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import { testRunStatus } from "@/config/selection";
import { RunType } from "@/types/run";

const defaultTestRun = {
  id: 0,
  name: "",
  configurations: 0,
  description: "",
  state: 0,
  projectId: 0,
};

type Props = {
  isOpen: boolean;
  editingRun: RunType;
  onCancel: () => void;
  onSubmit: (testRun: RunType) => void;
};

export default function RunDialog({
  isOpen,
  editingRun,
  onCancel,
  onSubmit,
}: Props) {
  const [testRun, setTestRun] = useState<RunType>(
    editingRun ? editingRun : defaultTestRun
  );
  const [isNameInvalid, setIsNameInvalid] = useState<boolean>(false);

  // const [runName, setRunName] = useState({
  //   text: editingRun ? editingRun.name : "",
  //   isValid: false,
  //   errorMessage: "",
  // });

  // const [runDetail, setRunDetail] = useState({
  //   text: editingRun ? editingRun.detail : "",
  //   isValid: false,
  //   errorMessage: "",
  // });

  // useEffect(() => {
  //   if (editingRun) {
  //     setRunName({
  //       ...runName,
  //       text: editingRun.name,
  //     });

  //     setRunDetail({
  //       ...runDetail,
  //       text: editingRun.detail ? editingRun.detail : "",
  //     });
  //   } else {
  //     setRunName({
  //       ...runName,
  //       text: "",
  //     });

  //     setRunDetail({
  //       ...runDetail,
  //       text: "",
  //     });
  //   }
  // }, [editingRun]);

  // const clear = () => {
  //   setRunName({
  //     isValid: false,
  //     text: "",
  //     errorMessage: "",
  //   });
  //   setRunDetail({
  //     isValid: false,
  //     text: "",
  //     errorMessage: "",
  //   });
  // };

  const validate = () => {
    // do validation

    onSubmit(testRun);
    // clear();
  };

  return (
    <Modal
      isOpen={isOpen}
      size="3xl"
      onOpenChange={() => {
        onCancel();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Run</ModalHeader>
        <ModalBody>
          <div className="container mx-auto">
            <div className="flex flex-wrap-mx-4">
              <div className="w-1/2 px-4">
                <Input
                  size="sm"
                  type="text"
                  variant="bordered"
                  label="Run Name"
                  value={testRun.name}
                  isInvalid={isNameInvalid}
                  errorMessage={isNameInvalid ? "please enter name" : ""}
                  onChange={(e) => {
                    setTestRun({ ...testRun, name: e.target.value });
                  }}
                  className="mt-3"
                />

                <Textarea
                  size="sm"
                  variant="bordered"
                  label="Run Detail"
                  value={testRun.description}
                  onValueChange={(changeValue) => {
                    setTestRun({ ...testRun, description: changeValue });
                  }}
                  className="mt-3"
                />

                <Select
                  size="sm"
                  variant="bordered"
                  selectedKeys={[testRunStatus[testRun.state].uid]}
                  onSelectionChange={(e) => {
                    const selectedUid = e.anchorKey;
                    const index = testRunStatus.findIndex(
                      (template) => template.uid === selectedUid
                    );
                    setTestRun({ ...testRun, state: index });
                  }}
                  label="template"
                  className="mt-3 max-w-xs"
                >
                  {testRunStatus.map((state, index) => (
                    <SelectItem key={state.uid} value={index}>
                      {state.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="w-1/2 px-4">
                <Button color="primary" onPress={onCancel}>
                  Select Test Cases
                </Button>
              </div>
            </div>
          </div>
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
