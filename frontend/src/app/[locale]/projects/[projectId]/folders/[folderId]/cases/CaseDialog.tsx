'use client';
import { useState } from 'react';
import { Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Switch } from '@heroui/react';
import { CasesMessages } from '@/types/case';

type Props = {
  isOpen: boolean;
  onCancel: () => void;
  onSubmit: (title: string, description: string, createMore: boolean) => void;
  messages: CasesMessages;
};

export default function CaseDialog({ isOpen, onCancel, onSubmit, messages }: Props) {
  const [caseTitle, setCaseName] = useState({
    text: 'Untitled Case',
    isValid: false,
    errorMessage: '',
  });

  const [caseDescription, setCaseDescription] = useState({
    text: '',
    isValid: false,
    errorMessage: '',
  });

  const [createMore, setCreateMore] = useState(false);

  const clear = () => {
    setCaseName({
      isValid: false,
      text: 'Untitled Case',
      errorMessage: '',
    });
    setCaseDescription({
      isValid: false,
      text: '',
      errorMessage: '',
    });
  };

  const validate = () => {
    if (!caseTitle.text) {
      setCaseName({
        text: '',
        isValid: true,
        errorMessage: messages.pleaseEnter,
      });

      return;
    }

    onSubmit(caseTitle.text, caseDescription.text, createMore);

    if (!createMore) {
      clear();
    } else {
      // Reset form fields but keep dialog open
      setCaseName({
        isValid: false,
        text: 'Untitled Case',
        errorMessage: '',
      });
      setCaseDescription({
        isValid: false,
        text: '',
        errorMessage: '',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        onCancel();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{messages.newTestCase}</ModalHeader>
        <ModalBody>
          <Input
            type="text"
            label={messages.caseTitle}
            value={caseTitle.text}
            isInvalid={caseTitle.isValid}
            errorMessage={caseTitle.errorMessage}
            onChange={(e) => {
              setCaseName({
                ...caseTitle,
                text: e.target.value,
              });
            }}
          />
          <Textarea
            label={messages.caseDescription}
            value={caseDescription.text}
            isInvalid={caseDescription.isValid}
            errorMessage={caseDescription.errorMessage}
            onChange={(e) => {
              setCaseDescription({
                ...caseDescription,
                text: e.target.value,
              });
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Switch size="sm" isSelected={createMore} onValueChange={setCreateMore}>
            {messages.createMore}
          </Switch>
          <Button color="primary" onPress={validate}>
            {messages.create}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
