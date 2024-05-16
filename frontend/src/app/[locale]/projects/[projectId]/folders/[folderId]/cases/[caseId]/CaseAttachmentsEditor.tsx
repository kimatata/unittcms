import { Image, Button, Tooltip, Card, CardBody } from "@nextui-org/react";
import { AttachmentType, CaseMessages } from "@/types/case";
import { Trash, ArrowDownToLine } from "lucide-react";
import { isImage } from "./isImage";

type Props = {
  attachments: AttachmentType[];
  onAttachmentDownload: (
    attachmentId: number,
    downloadFileName: string
  ) => void;
  onAttachmentDelete: (attachmentId: number) => void;
  messages: CaseMessages,
};

export default function CaseAttachmentsEditor({
  attachments = [],
  onAttachmentDownload,
  onAttachmentDelete,
  messages,
}: Props) {
  let images = [];
  let others = [];

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
                src={image.path}
                className="object-cover h-40 w-40"
              />
              <div className="flex items-center justify-between">
                <p>{image.title}</p>
                <Tooltip content={messages.delete}>
                  <Button
                    isIconOnly
                    size="sm"
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
    </>
  );
}
