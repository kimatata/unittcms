'use client';
import { useState, ChangeEvent, DragEvent } from 'react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Alert,
  Checkbox,
  Chip,
} from '@heroui/react';
import { ArrowUpFromLine } from 'lucide-react';
import { CasesMessages, ImportPreviewResponse } from '@/types/case';
import { previewImportCases, commitImportCases } from '@/utils/caseControl';

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
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [includedSheets, setIncludedSheets] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    setImportError(null);

    if (filesArray.length !== 1) {
      console.error('Error multiple file');
    } else {
      const file = filesArray[0];
      const ret = await previewImportCases(token, folderId, file);
      if (ret.error) {
        setImportError(ret.error);
      } else {
        setPreview(ret);
        setSelectedFile(file);
        const defaults: Record<string, boolean> = {};
        ret.sheets.forEach((sheet) => {
          defaults[sheet.sheetName] = sheet.summary.new + sheet.summary.update > 0;
        });
        setIncludedSheets(defaults);
      }
    }
    setIsProcessing(false);
  };

  const handleCommit = async () => {
    if (!preview || !selectedFile) return;
    setIsProcessing(true);
    setImportError(null);

    const includedSheetNames = preview.sheets.filter((sheet) => includedSheets[sheet.sheetName]).map((sheet) => sheet.sheetName);

    const ret = await commitImportCases(token, folderId, selectedFile, includedSheetNames);
    setIsProcessing(false);
    if (ret.error) {
      setImportError(ret.error);
    } else {
      resetState();
      onImport();
    }
  };

  const resetState = () => {
    setImportError(null);
    setPreview(null);
    setIncludedSheets({});
    setSelectedFile(null);
  };

  const onCloseDialog = () => {
    resetState();
    onCancel();
  };

  return (
    <Modal
      isOpen={isOpen}
      size={preview ? '3xl' : 'md'}
      onOpenChange={() => {
        onCloseDialog();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 font-extrabold text-[#2b2f37]">
          {preview ? messages.importPreviewTitle : messages.importCases}
        </ModalHeader>
        <ModalBody>
          {importError && <Alert color="danger" className="mt-1" title="error" description={importError} />}

          {!preview && (
            <>
              <div className="flex items-center justify-center w-full">
                <div className="mt-1 text-slate-500 text-sm rounded">
                  <div>{messages.importAvailable}</div>
                  <a href="/template/unittcms-import-template-v1.1.xlsx" download className="text-tiny underline">
                    {messages.downloadTemplate}
                  </a>
                </div>
              </div>
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
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50 hover:bg-indigo-50/50 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ArrowUpFromLine />
                    <p className="mb-2 text-sm text-slate-500">
                      <span className="font-semibold">{messages.clickToUpload}</span>
                      <span>{messages.orDragAndDrop}</span>
                    </p>
                    <p className="text-xs text-slate-500">{messages.maxFileSize}: 50 MB</p>
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
              {isProcessing && (
                <div className="flex justify-center mt-3">
                  <Spinner />
                </div>
              )}
            </>
          )}

          {preview && (
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              {preview.sheets.map((sheet) => (
                <div key={sheet.sheetName} className="bg-slate-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-[#2b2f37]">
                        {messages.sheet}: {sheet.sheetName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {messages.targetFolder}: {sheet.targetFolderName}
                      </div>
                    </div>
                    <Checkbox
                      isSelected={!!includedSheets[sheet.sheetName]}
                      onValueChange={(checked) =>
                        setIncludedSheets((prev) => ({ ...prev, [sheet.sheetName]: checked }))
                      }
                    >
                      {messages.includeSheet}
                    </Checkbox>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Chip color="success" variant="flat">
                      {messages.newCases}: {sheet.summary.new}
                    </Chip>
                    <Chip color="primary" variant="flat">
                      {messages.updateCases}: {sheet.summary.update}
                    </Chip>
                    {sheet.summary.failed > 0 && (
                      <Chip color="danger" variant="flat">
                        {messages.failedCases}: {sheet.summary.failed}
                      </Chip>
                    )}
                  </div>

                  {sheet.summary.total === 0 && (
                    <div className="text-sm text-slate-500 mt-3">{messages.noImportableCases}</div>
                  )}

                  {sheet.summary.failed > 0 && (
                    <div className="mt-3 flex flex-col gap-1">
                      {sheet.cases
                        .filter((c) => c.status === 'error')
                        .map((c, i) => (
                          <div key={i} className="text-sm text-red-600">
                            {messages.row} {c.rowNumbers.join(', ')}: {c.errors?.join('; ')}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-center">
                  <Spinner />
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {!isProcessing && (
            <>
              {preview && (
                <Button variant="light" size="sm" onPress={resetState}>
                  {messages.back}
                </Button>
              )}
              <Button variant="light" size="sm" onPress={onCloseDialog}>
                {messages.close}
              </Button>
              {preview && (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#4953ac] to-[#652fe7] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20"
                  isDisabled={!Object.values(includedSheets).some(Boolean)}
                  onPress={handleCommit}
                >
                  {messages.importSelected}
                </Button>
              )}
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
