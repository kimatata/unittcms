'use client';
import { useEffect, useState, useContext, ChangeEvent, DragEvent } from 'react';
import { Spinner, addToast } from '@heroui/react';
import AttachmentsEditor from '@/components/AttachmentsEditor';
import { TokenContext } from '@/utils/TokenProvider';
import {
  fetchRunCaseAttachments,
  createRunCaseAttachments,
  deleteRunCaseAttachment,
} from '@/utils/runCaseAttachmentControl';
import { fetchDownloadAttachment } from '@/utils/attachmentDownload';
import { logError } from '@/utils/errorHandler';
import type { AttachmentType } from '@/types/case';
import type { AttachmentMessages } from '@/types/attachment';

type Props = {
  projectId: string;
  runCaseId?: number;
  messages: AttachmentMessages;
};

export default function RunCaseAttachments({ projectId, runCaseId, messages }: Props) {
  const context = useContext(TokenContext);
  const [attachments, setAttachments] = useState<AttachmentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadAttachments() {
      if (!runCaseId || !context.isSignedIn()) return;

      setIsLoading(true);
      try {
        const data = await fetchRunCaseAttachments(context.token.access_token, runCaseId);
        setAttachments(data);
      } catch (error: unknown) {
        logError('Error fetching run case attachments', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAttachments();
  }, [runCaseId, context]);

  const handleUpload = async (files: File[]) => {
    if (!runCaseId || files.length === 0) return;

    setIsSubmitting(true);
    try {
      const newAttachments = await createRunCaseAttachments(context.token.access_token, runCaseId, files);
      if (!newAttachments) {
        throw new Error('Failed to upload attachments');
      }
      setAttachments([...attachments, ...newAttachments]);
      addToast({
        title: 'Success',
        color: 'success',
        description: messages.attachmentUploaded,
      });
    } catch (error: unknown) {
      logError('Error uploading run case attachments', error);
      addToast({
        title: 'Error',
        color: 'danger',
        description: messages.failedToUploadAttachment,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (event.dataTransfer) {
      handleUpload(Array.from(event.dataTransfer.files));
    }
  };

  const handleInput = (event: ChangeEvent) => {
    if (event.target) {
      const input = event.target as HTMLInputElement;
      if (input.files) {
        handleUpload(Array.from(input.files));
      }
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!runCaseId) return;

    setIsSubmitting(true);
    try {
      await deleteRunCaseAttachment(context.token.access_token, runCaseId, attachmentId);
      setAttachments(attachments.filter((attachment) => attachment.id !== attachmentId));
      addToast({
        title: 'Success',
        color: 'success',
        description: messages.attachmentDeleted,
      });
    } catch (error: unknown) {
      logError('Error deleting run case attachment', error);
      addToast({
        title: 'Error',
        color: 'danger',
        description: messages.failedToDeleteAttachment,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!runCaseId) {
    return (
      <div className="text-default-500 text-sm">
        <p>{messages.notIncludedInRun}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const canEdit = !!projectId && context.isProjectReporter(Number(projectId));

  return (
    <div className="h-full flex flex-col p-1">
      {attachments.length === 0 && (
        <div className="text-center text-default-400 py-8">
          <p>{messages.noAttachments}</p>
        </div>
      )}

      <AttachmentsEditor
        isDisabled={!canEdit || isSubmitting}
        attachments={attachments}
        onAttachmentDownload={(attachmentId: number, downloadFileName: string) =>
          fetchDownloadAttachment(attachmentId, downloadFileName)
        }
        onAttachmentDelete={handleDelete}
        onFilesDrop={handleDrop}
        onFilesInput={handleInput}
        messages={messages}
        inputId="run-case-dropzone-file"
      />
    </div>
  );
}
