import { describe, expect, test } from 'vitest';
import { isImage } from '@/utils/isImage';
import { AttachmentType } from '@/types/case';

describe('attachment control', () => {
  test('isImage', () => {
    type CaseAttachmentType = {
      createdAt: Date;
      updatedAt: Date;
      caseId: number;
      attachmentId: number;
    };

    const sampleCaseAttachment: CaseAttachmentType = {
      createdAt: new Date(),
      updatedAt: new Date(),
      caseId: 1,
      attachmentId: 1,
    };

    const sampleAttachment: AttachmentType = {
      id: 1,
      title: '',
      detail: '',
      filename: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      caseAttachments: sampleCaseAttachment,
    };

    sampleAttachment.filename = 'abc.png';
    expect(isImage(sampleAttachment)).toBe(true);

    sampleAttachment.filename = 'abc.mp3';
    expect(isImage(sampleAttachment)).toBe(false);
  });
});
