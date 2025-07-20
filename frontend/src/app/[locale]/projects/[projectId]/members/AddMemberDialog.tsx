'use client';
import { useState, useEffect, useContext } from 'react';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import CandidatesTable from './CandidatesTable';
import { TokenContext } from '@/utils/TokenProvider';
import { UserType } from '@/types/user';
import { searchUsers } from '@/utils/usersControl';
import { MembersMessages } from '@/types/member';
import { logError } from '@/utils/errorHandler';

type Props = {
  isOpen: boolean;
  projectId: string;
  onCancel: () => void;
  onAddMember: (memberAdded: UserType) => void;
  messages: MembersMessages;
};

export default function AddMemberDialog({ isOpen, projectId, onCancel, onAddMember, messages }: Props) {
  const context = useContext(TokenContext);
  const [searchText, setSearchText] = useState('');
  const [candidates, setCandidates] = useState<UserType[]>([]);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!searchText) {
        return;
      }

      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await searchUsers(context.token.access_token, Number(projectId), searchText);
        setCandidates(data);
      } catch (error: unknown) {
        logError('Error fetching data:', error);
      }
    }

    fetchDataEffect();
  }, [context, projectId, searchText]);

  const handleExit = () => {
    setSearchText('');
    setCandidates([]);
    onCancel();
  };

  const handleAdd = (userAdded: UserType) => {
    onAddMember(userAdded);
    handleExit();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        handleExit();
      }}
      size="2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{messages.addMember}</ModalHeader>
        <ModalBody>
          <Input
            type="text"
            label={messages.userNameOrEmail}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
          />
          <CandidatesTable candidates={candidates} onAddPress={handleAdd} messages={messages} />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleExit}>
            {messages.close}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
