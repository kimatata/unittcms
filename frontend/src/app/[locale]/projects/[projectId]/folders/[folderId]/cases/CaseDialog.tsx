'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { CasesMessages } from '@/types/case';

type Props = {
  isOpen: boolean;
  onCancel: () => void;
  onSubmit: (title: string, description: string) => void;
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

    onSubmit(caseTitle.text, caseDescription.text);
    clear();
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
          <Button variant="light" onPress={onCancel}>
            {messages.close}
          </Button>
          <Button color="primary" onPress={validate}>
            {messages.create}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
