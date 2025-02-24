'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { FolderType, FoldersMessages } from '@/types/folder';

type Props = {
  isOpen: boolean;
  editingFolder: FolderType | null;
  onCancel: () => void;
  onSubmit: (name: string, detail: string) => void;
  messages: FoldersMessages;
};

export default function FolderDialog({ isOpen, editingFolder, onCancel, onSubmit, messages }: Props) {
  const [folderName, setFolderName] = useState({
    text: editingFolder ? editingFolder.name : '',
    isValid: false,
    errorMessage: '',
  });

  const [folderDetail, setFolderDetail] = useState({
    text: editingFolder ? editingFolder.detail : '',
    isValid: false,
    errorMessage: '',
  });

  useEffect(() => {
    if (editingFolder) {
      setFolderName({
        ...folderName,
        text: editingFolder.name,
      });

      setFolderDetail({
        ...folderDetail,
        text: editingFolder.detail ? editingFolder.detail : '',
      });
    } else {
      setFolderName({
        ...folderName,
        text: '',
      });

      setFolderDetail({
        ...folderDetail,
        text: '',
      });
    }
  }, [editingFolder]);

  const clear = () => {
    setFolderName({
      isValid: false,
      text: '',
      errorMessage: '',
    });
    setFolderDetail({
      isValid: false,
      text: '',
      errorMessage: '',
    });
  };

  const validate = () => {
    if (!folderName.text) {
      setFolderName({
        text: '',
        isValid: true,
        errorMessage: messages.pleaseEnter,
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
        <ModalHeader className="flex flex-col gap-1">{messages.folder}</ModalHeader>
        <ModalBody>
          <Input
            type="text"
            label={messages.folderName}
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
            label={messages.folderDetail}
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
            {messages.close}
          </Button>
          <Button color="primary" onPress={validate}>
            {editingFolder ? messages.update : messages.create}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
