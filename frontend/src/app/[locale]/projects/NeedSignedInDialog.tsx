'use client';
import { ProjectsMessages } from '@/types/project';
import { Link } from '@/src/navigation';
import { Button, Modal, ModalContent, ModalHeader, ModalFooter } from '@nextui-org/react';

type Props = {
  isOpen: boolean;
  onCancel: () => void;
  messages: ProjectsMessages;
  locale: string;
};

export default function NeedSignedInDialog({ isOpen, onCancel, messages, locale }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        onCancel();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{messages.needSignedIn}</ModalHeader>
        <ModalFooter>
          <Link href={'/account/signin'} locale={locale}>
            <Button color="primary">{messages.signIn}</Button>
          </Link>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
