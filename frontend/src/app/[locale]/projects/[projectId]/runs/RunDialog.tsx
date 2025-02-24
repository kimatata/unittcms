'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { RunType, RunsMessages } from '@/types/run';

type Props = {
  isOpen: boolean;
  editingRun: RunType | null;
  onCancel: () => void;
  onSubmit: (name: string, description: string) => void;
  messages: RunsMessages;
};

export default function RunDialog({ isOpen, editingRun, onCancel, onSubmit, messages }: Props) {
  const [runName, setRunName] = useState({
    text: editingRun ? editingRun.name : '',
    isInvalid: false,
    errorMessage: '',
  });

  const [runDescription, setRunDescription] = useState({
    text: editingRun ? editingRun.description : '',
    isInvalid: false,
    errorMessage: '',
  });

  useEffect(() => {
    if (editingRun) {
      setRunName({
        ...runName,
        text: editingRun.name,
      });

      setRunDescription({
        ...runDescription,
        text: editingRun.description ? editingRun.description : '',
      });
    } else {
      setRunName({
        ...runName,
        text: '',
      });

      setRunDescription({
        ...runDescription,
        text: '',
      });
    }
  }, [editingRun]);

  const clear = () => {
    setRunName({
      isInvalid: false,
      text: '',
      errorMessage: '',
    });
    setRunDescription({
      isInvalid: false,
      text: '',
      errorMessage: '',
    });
  };

  const validate = () => {
    if (!runName.text) {
      setRunName({
        text: '',
        isInvalid: true,
        errorMessage: messages.pleaseEnter,
      });

      return;
    }

    onSubmit(runName.text, runDescription.text);
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
        <ModalHeader className="flex flex-col gap-1">{messages.run}</ModalHeader>
        <ModalBody>
          <Input
            type="text"
            label={messages.runName}
            value={runName.text}
            isInvalid={runName.isInvalid}
            errorMessage={runName.errorMessage}
            onChange={(e) => {
              setRunName({
                ...runName,
                text: e.target.value,
              });
            }}
          />
          <Textarea
            label={messages.runDescription}
            value={runDescription.text}
            isInvalid={runDescription.isInvalid}
            errorMessage={runDescription.errorMessage}
            onChange={(e) => {
              setRunDescription({
                ...runDescription,
                text: e.target.value,
              });
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onCancel}>
            {messages.close}
          </Button>
          <Button color="primary" onPress={validate}>
            {editingRun && editingRun.createdAt ? messages.update : messages.create}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
