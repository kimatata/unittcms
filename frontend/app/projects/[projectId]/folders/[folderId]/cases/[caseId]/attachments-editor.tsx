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
  return (
    <>
      {attachments.map((attachment, index) => (
        <div key={index} className="flex">
          <Image alt={attachment.title} src={attachment.path} className="object-cover h-40 w-40"/>
          <div className="mt-3 ms-1">
            <Tooltip content="Delete this attachment file" placement="left">
              <Button
                isIconOnly
                size="sm"
                className="bg-transparent rounded-full"
                onPress={() => onAttachmentDelete(attachment.id)}
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
