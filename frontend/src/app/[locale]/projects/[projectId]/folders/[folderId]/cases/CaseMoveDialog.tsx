'use client';
import { useState } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner, addToast } from '@heroui/react';
import { Files, FileInput } from 'lucide-react';
import { CasesMessages } from '@/types/case';
import { moveCases, cloneCases } from '@/utils/caseControl';

type Props = {
  isOpen: boolean;
  testCaseIds: number[];
  projectId: string;
  targetFolderId?: number;
  onCancel: () => void;
  onMoved: () => void;
  messages: CasesMessages;
  token: string;
};

export default function CaseDialog({
  isOpen,
  testCaseIds,
  projectId,
  targetFolderId,
  onCancel,
  onMoved,
  messages,
  token,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMove = async () => {
    if (!targetFolderId) {
      return;
    }

    setIsProcessing(true);
    const success = await moveCases(token, testCaseIds, targetFolderId, Number(projectId));
    setIsProcessing(false);

    if (success) {
      addToast({
        title: 'Success',
        color: 'success',
        description: messages.casesMoved,
      });
      onMoved();
      onCancel();
    } else {
      console.error('Error moving cases');
    }
  };

  const handleClone = async () => {
    if (!targetFolderId) {
      return;
    }

    setIsProcessing(true);
    const success = await cloneCases(token, testCaseIds, targetFolderId, Number(projectId));
    setIsProcessing(false);

    if (success) {
      addToast({ title: 'Success', color: 'success', description: messages.casesCloned });
      onCancel();
    } else {
      console.error('Error cloning cases');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        onCancel();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{messages.selectAction}</ModalHeader>
        <ModalBody>
          <p>{testCaseIds.length} cases selected</p>
        </ModalBody>
        <ModalFooter>
          {isProcessing ? (
            <Spinner />
          ) : (
            <>
              <Button variant="light" size="sm" onPress={onCancel}>
                {messages.close}
              </Button>
              <Button color="primary" size="sm" onPress={handleClone} startContent={<Files size={16} />}>
                {messages.clone}
              </Button>
              <Button color="primary" size="sm" onPress={handleMove} startContent={<FileInput size={16} />}>
                {messages.move}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
