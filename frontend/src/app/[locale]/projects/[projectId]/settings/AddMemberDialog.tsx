'use client';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react';
import { SettingsMessages } from '@/types/settings';
import { TokenContext } from '@/utils/TokenProvider';
import Config from '@/config/config';
import { MemberType, UserType } from '@/types/user';
import CandidatesTable from './CandidatesTable';
const apiServer = Config.apiServer;

type Props = {
  isOpen: boolean;
  members: MemberType[];
  onCancel: () => void;
  onAddMember: (memberAdded: UserType) => void;
  messages: SettingsMessages;
};

// User Search by username
async function searchUsers(jwt: string, text: string, excludeIdsParam: string) {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/users/find?search=${text}&excludeIds=${excludeIdsParam}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

export default function AddMemberDialog({ isOpen, members, onCancel, onAddMember, messages }: Props) {
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
        const excludeIds = members.map((member) => {
          return member.id;
        });
        const excludeIdsParam = excludeIds.join(',');
        const data = await searchUsers(context.token.access_token, searchText, excludeIdsParam);
        setCandidates(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [searchText]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        onCancel();
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
          <CandidatesTable candidates={candidates} onAddPress={onAddMember} messages={messages} />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onCancel}>
            {messages.close}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
