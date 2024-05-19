import { AttachmentType } from '@/types/case';

function isImage(attachmentFile: AttachmentType) {
  let path = attachmentFile.path;
  let extension = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
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
