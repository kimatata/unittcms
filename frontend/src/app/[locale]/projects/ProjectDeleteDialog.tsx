'use client';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react';
import { ProjectsMessages } from '@/types/project';

type Props = {
  isOpen: boolean;
  deleteProjectId: number | null;
  onCancel: () => void;
  onConfirm: (projectId: number | number) => {};
  messages: ProjectsMessages;
};

export default function ProjectDialog({ isOpen, deleteProjectId, onCancel, onConfirm, messages }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        onCancel();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{messages.delete}</ModalHeader>
        <ModalBody>{messages.areYouSure}</ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onCancel}>
            {messages.close}
          </Button>
          <Button color="danger" onPress={() => onConfirm(deleteProjectId)}>
            {messages.delete}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
