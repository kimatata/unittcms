import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';

type Props = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  closeText: string;
  confirmText: string;
  deleteText: string;
};

export default function DeleteConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  closeText,
  confirmText,
  deleteText,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        onCancel();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{deleteText}</ModalHeader>
        <ModalBody>{confirmText}</ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onCancel}>
            {closeText}
          </Button>
          <Button color="danger" onPress={() => onConfirm()}>
            {deleteText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
