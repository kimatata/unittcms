// Subset of the attachment labels the shared AttachmentsEditor renders, so that
// both the "Case" and the "Attachments" message groups can be passed to it.
type AttachmentsEditorMessages = {
  delete: string;
  download: string;
  close: string;
  clickToUpload: string;
  orDragAndDrop: string;
  maxFileSize: string;
};

type AttachmentMessages = AttachmentsEditorMessages & {
  attachments: string;
  noAttachments: string;
  notIncludedInRun: string;
  attachmentUploaded: string;
  failedToUploadAttachment: string;
  attachmentDeleted: string;
  failedToDeleteAttachment: string;
};

export type { AttachmentsEditorMessages, AttachmentMessages };
