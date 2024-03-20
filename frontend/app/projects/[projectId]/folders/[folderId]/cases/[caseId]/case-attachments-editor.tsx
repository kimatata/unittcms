import { Image, Button, Tooltip, Card, CardBody } from "@nextui-org/react";
import { AttachmentType } from "./caseTypes";
import { Trash, ArrowDownToLine } from "lucide-react";

type Props = {
  attachments: AttachmentType[];
  onAttachmentDownload: (
    attachmentId: number,
    downloadFileName: string
  ) => void;
  onAttachmentDelete: (attachmentId: number) => void;
};

export default function CaseAttachmentsEditor({
  attachments = [],
  onAttachmentDownload,
  onAttachmentDelete,
}: Props) {
  let images = [];
  let others = [];

  attachments.forEach((attachment) => {
    let path = attachment.path;
    let extension = path.substring(path.lastIndexOf(".") + 1).toLowerCase();
    if (
      extension === "png" ||
      extension === "jpg" ||
      extension === "jpeg" ||
      extension === "gif" ||
      extension === "bmp" ||
      extension === "svg"
    ) {
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
                <Tooltip content="Delete">
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
                <Tooltip content="Download">
                  <Button
                    isIconOnly
                    size="sm"
                    className="bg-transparent rounded-full"
                    onPress={() => onAttachmentDownload(file.id, file.title)}
                  >
                    <ArrowDownToLine size={16} />
                  </Button>
                </Tooltip>
                <Tooltip content="Delete">
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
