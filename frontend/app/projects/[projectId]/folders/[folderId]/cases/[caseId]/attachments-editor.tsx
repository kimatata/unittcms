import { Image, Button, Tooltip } from "@nextui-org/react";
import { AttachmentType } from "./page";
import { Trash } from "lucide-react";

type Props = {
  attachments: AttachmentType[];
  onAttachmentDelete: (attachmentId: number) => void;
};

export default function AttachmentsEditor({
  attachments = [],
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
      {images.map((image, index) => (
        <div key={index} className="flex">
          <Image
            alt={image.title}
            src={image.path}
            className="object-cover h-40 w-40"
          />
          <div className="mt-3 ms-1">
            <Tooltip content="Delete this image file" placement="left">
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
        </div>
      ))}

      {others.map((file, index) => (
        <div key={index} className="flex">
          <div>{file.title}</div>
          <div>{file.path}</div>
          <div className="mt-3 ms-1">
            <Tooltip content="Delete this attachment file" placement="left">
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
      ))}
    </>
  );
}
