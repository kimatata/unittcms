import { describe, expect, test } from 'vitest';
import { isImage } from './isImage';
import { AttachmentType } from '@/types/case';

describe('attachment control', () => {
  test('isImage', () => {
    type CaseAttachmentType = {
      createdAt: Date;
      updatedAt: Date;
      CaseId: number;
      AttachmentId: number;
    };

    const sampleCaseAttachment: CaseAttachmentType = {
      createdAt: new Date(),
      updatedAt: new Date(),
      CaseId: 1,
      AttachmentId: 1,
    };

    const sampleAttachment: AttachmentType = {
      id: 1,
      title: '',
      detail: '',
      path: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      caseAttachments: sampleCaseAttachment,
    };

    sampleAttachment.path = 'public/uploads/abc.png';
    expect(isImage(sampleAttachment)).toBe(true);

    sampleAttachment.path = 'public/uploads/abc.mp3';
    expect(isImage(sampleAttachment)).toBe(false);
  });
});
