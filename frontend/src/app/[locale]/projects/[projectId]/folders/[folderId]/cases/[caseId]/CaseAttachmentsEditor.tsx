import { Image, Button, Tooltip, Card, CardBody } from '@heroui/react';
import { Trash, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { ChangeEvent, DragEvent } from 'react';
import { isImage } from './isImage';
import { AttachmentType, CaseMessages } from '@/types/case';
import Config from '@/config/config';

const apiServer = Config.apiServer;

type Props = {
  isDisabled: boolean;
  attachments: AttachmentType[];
  onAttachmentDownload: (attachmentId: number, downloadFileName: string) => void;
  onAttachmentDelete: (attachmentId: number) => void;
  onFilesDrop: (event: DragEvent<HTMLElement>) => void;
  onFilesInput: (event: ChangeEvent) => void;
  messages: CaseMessages;
};

export default function CaseAttachmentsEditor({
  isDisabled = false,
  attachments = [],
  onAttachmentDownload,
  onAttachmentDelete,
  onFilesDrop,
  onFilesInput,
  messages,
}: Props) {
  const images: AttachmentType[] = [];
  const others: AttachmentType[] = [];

  attachments.forEach((attachment) => {
    if (isImage(attachment)) {
      images.push(attachment);
    } else {
      others.push(attachment);
    }
  });
  return (
    <>
      <div className="flex flex-wrap mt-3">
        {images.map((image, index) => (
          <Card key={index} radius="sm" className="mt-2 me-2 max-w-md">
            <CardBody>
              <Image
                alt={image.title}
                src={`${apiServer}/uploads/${image.filename}`}
                className="object-cover h-40 w-40"
              />
              <div className="flex items-center justify-between">
                <p>{image.title}</p>
                <Tooltip content={messages.delete}>
                  <Button
                    isIconOnly
                    size="sm"
                    isDisabled={isDisabled}
                    className="bg-transparent rounded-full"
                    onPress={() => onAttachmentDelete(image.id)}
                  >
                    <Trash size={16} />
                  </Button>
                </Tooltip>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {others.map((file, index) => (
        <Card key={index} radius="sm" className="mt-2 max-w-md">
          <CardBody>
            <div className="flex items-center justify-between">
              <p>{file.title}</p>
              <div>
                <Tooltip content={messages.download}>
                  <Button
                    isIconOnly
                    size="sm"
                    className="bg-transparent rounded-full"
                    onPress={() => onAttachmentDownload(file.id, file.title)}
                  >
                    <ArrowDownToLine size={16} />
                  </Button>
                </Tooltip>
                <Tooltip content={messages.delete}>
                  <Button
                    isIconOnly
                    size="sm"
                    className="bg-transparent rounded-full"
                    onPress={() => onAttachmentDelete(file.id)}
                  >
                    <Trash size={16} />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}

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
            onChange={(e) => onFilesInput(e)}
            multiple
          />
        </label>
      </div>
    </>
  );
}
