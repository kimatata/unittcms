import { AttachmentType } from '@/types/case';

function isImage(attachmentFile: AttachmentType) {
  const filename = attachmentFile.filename;
  const extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  if (
    extension === 'png' ||
    extension === 'jpg' ||
    extension === 'jpeg' ||
    extension === 'gif' ||
    extension === 'bmp' ||
    extension === 'svg'
  ) {
    return true;
  } else {
    return false;
  }
}

export { isImage };
