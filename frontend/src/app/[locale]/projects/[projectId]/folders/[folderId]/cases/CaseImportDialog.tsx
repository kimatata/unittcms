'use client';
import { useState, ChangeEvent, DragEvent } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner, Alert } from '@heroui/react';
import { ArrowUpFromLine } from 'lucide-react';
import { CasesMessages } from '@/types/case';
import { importCases } from '@/utils/caseControl';

type Props = {
  isOpen: boolean;
  folderId: number;
  isDisabled: boolean;
  onImport: () => void;
  onCancel: () => void;
  messages: CasesMessages;
  token: string;
};

export default function CaseImportDialog({ isOpen, folderId, isDisabled, onImport, onCancel, messages, token }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (event.dataTransfer) {
      const filesArray = Array.from(event.dataTransfer.files);
      handleFiles(filesArray);
    }
  };

  const handleInput = (event: ChangeEvent) => {
    if (event.target) {
      const input = event.target as HTMLInputElement;
      if (input.files) {
        handleFiles(Array.from(input.files));
      }
    }
  };

  const handleFiles = async (filesArray: File[]) => {
    setIsProcessing(true);

    if (filesArray.length !== 1) {
      console.error('Error multiple file');
    } else {
      const ret = await importCases(token, folderId, filesArray[0]);
      if (ret.error) {
        setImportError(ret.error);
      } else {
        onImport();
      }
    }
    setIsProcessing(false);
  };

  const onCloseDialog = () => {
    setImportError(null);
    onCancel();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        onCloseDialog();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{messages.importCases}</ModalHeader>
        <ModalBody>
          <div className="flex items-center justify-center w-full">
            <div className={`mt-1 text-neutral-500 dark:text-neutral-400 text-sm rounded`}>
              <div>{messages.importAvailable}</div>
              <a href="/template/unittcms-import-template-v1.1.xlsx" download className="text-tiny underline">
                {messages.downloadTemplate}
              </a>
            </div>
          </div>
          {importError && <Alert color="danger" className="mt-1" title="error" description={importError} />}
          <div
            className="flex items-center justify-center w-full mt-3"
            onDrop={(event) => {
              if (isDisabled) {
                return;
              }
              handleDrop(event);
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
              <Button variant="light" size="sm" onPress={onCloseDialog}>
                {messages.close}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
