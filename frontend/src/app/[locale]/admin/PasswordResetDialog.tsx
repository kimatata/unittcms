import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input } from '@heroui/react';
import { useState } from 'react';
import { isValidPassword } from '../account/validate';
import { AdminMessages } from '@/types/user';

type Props = {
  isOpen: boolean;
  onCancel: () => void;
  onReset: (newPassword: string) => void;
  messages: AdminMessages;
};

export default function PasswordResetDialog({ isOpen, onCancel, onReset, messages }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validate = async () => {
    if (newPassword !== confirmPassword) {
      setErrorMessage(messages.passwordNotMatch);
      return;
    }

    if (!isValidPassword(newPassword)) {
      setErrorMessage(messages.invalidPassword);
      return;
    }

    onReset(newPassword);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        onCancel();
      }}
    >
      <ModalContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            validate();
          }}
        >
          <ModalHeader className="flex flex-col gap-1">{messages.resetPassword}</ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              {errorMessage && <div className="my-3 text-danger">{errorMessage}</div>}
              <Input
                size="sm"
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                size="sm"
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="mt-3"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="light" onPress={onCancel}>
              {messages.close}
            </Button>
            <Button type="submit" color="danger">
              {messages.reset}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
