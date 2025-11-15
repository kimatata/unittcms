'use client';
import { useState } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner } from '@heroui/react';
import { ArrowUpFromLine } from 'lucide-react';
import { CasesMessages } from '@/types/case';
import { importCases } from '@/utils/caseControl';

type Props = {
  isOpen: boolean;
  targetFolderId?: number;
  isDisabled: boolean;
  onImport: () => void;
  onCancel: () => void;
  messages: CasesMessages;
  token: string;
};

export default function CaseImportDialog({
  isOpen,
  targetFolderId,
  isDisabled,
  onImport,
  onCancel,
  messages,
  token,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInput = (event: ChangeEvent) => {
    setIsProcessing(true);
    if (event.target) {
      const input = event.target as HTMLInputElement;
      if (input.files) {
        const filesArray = Array.from(input.files);
        if (filesArray.length !== 1) {
          console.error('Error multiple file');
        } else {
          importCases(token, Number(targetFolderId), filesArray[0]);
        }
      }
    }
    setIsProcessing(false);
    onImport();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        onCancel();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{messages.importCases}</ModalHeader>
        <ModalBody>
          <div
            className="flex items-center justify-center w-96 mt-3"
            onDrop={(event) => {
              if (isDisabled) {
                return;
              }
              onFilesDrop(event);
            }}
            onDragOver={(event) => event.preventDefault()}
          >
            <label
              htmlFor="dropzone-file"
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-200 border-dashed rounded-lg  bg-neutral-50 dark:hover:bg-bray-800 dark:bg-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:bg-neutral-600 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ArrowUpFromLine />
                <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold">{messages.clickToUpload}</span>
                  <span>{messages.orDragAndDrop}</span>
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{messages.maxFileSize}: 50 MB</p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                disabled={isDisabled}
                onChange={(e) => handleInput(e)}
              />
            </label>
          </div>
        </ModalBody>
        <ModalFooter>
          {isProcessing ? (
            <Spinner />
          ) : (
            <>
              <Button variant="light" size="sm" onPress={onCancel}>
                {messages.downloadTemplate}
              </Button>
              <Button variant="light" size="sm" onPress={onCancel}>
                {messages.close}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
