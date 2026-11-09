'use client';
import { useContext, useEffect, useState } from 'react';
import {
  addToast,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Snippet,
} from '@heroui/react';
import { Check, Mail, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { memberRoles } from '@/config/selection';
import { InvitationMessages, InvitationType } from '@/types/invitation';
import { TokenContext } from '@/utils/TokenProvider';
import { createInvitation, fetchInvitations, revokeInvitation } from '@/utils/invitationsControl';
import { logError } from '@/utils/errorHandler';

type Props = {
  isOpen: boolean;
  projectId: string;
  locale: string;
  messages: InvitationMessages;
  onCancel: () => void;
};

export default function InviteDialog({ isOpen, projectId, locale, messages, onCancel }: Props) {
  const context = useContext(TokenContext);
  const reporterRole = memberRoles.findIndex((entry) => entry.uid === 'reporter');
  const [role, setRole] = useState(reporterRole);
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState<InvitationType[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [lastToken, setLastToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!isOpen || !context.isSignedIn()) {
        return;
      }
      setInvitations(await fetchInvitations(context.token.access_token, projectId));
    }

    fetchDataEffect();
  }, [isOpen, context, projectId]);

  const roleLabel = (index: number) => {
    const uid = memberRoles[index] ? memberRoles[index].uid : '';
    if (uid === 'manager') return messages.roleManager;
    if (uid === 'developer') return messages.roleDeveloper;
    return messages.roleReporter;
  };

  // L'adresse de la page publique, construite depuis le navigateur : le serveur
  // ne connaît pas le nom de domaine derrière lequel on l'a placé.
  const linkFor = (token: string) =>
    typeof window === 'undefined' ? '' : `${window.location.origin}/${locale}/account/invite/${token}`;

  const messageFor = (token: string) => `${messages.shareBody} ${linkFor(token)}`;

  const onCreate = async () => {
    setIsCreating(true);
    try {
      const invitation = await createInvitation(context.token.access_token, projectId, role, email.trim() || null);
      setInvitations(await fetchInvitations(context.token.access_token, projectId));
      setLastToken(invitation.token);
      setEmail('');
    } catch (error: unknown) {
      addToast({ title: 'Error', color: 'danger', description: messages.inviteError });
      logError('Error creating invitation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const onRevoke = async (invitationId: number) => {
    try {
      await revokeInvitation(context.token.access_token, projectId, invitationId);
      setInvitations(await fetchInvitations(context.token.access_token, projectId));
      setLastToken(null);
    } catch (error: unknown) {
      addToast({ title: 'Error', color: 'danger', description: messages.inviteError });
      logError('Error revoking invitation:', error);
    }
  };

  /**
   * Les deux canaux ouvrent une application tierce avec le message déjà écrit.
   * WhatsApp sans numéro laisse choisir le destinataire dans son carnet ; le
   * courriel part vers l'adresse notée sur l'invitation quand il y en a une.
   */
  const shareOn = (invitation: InvitationType, channel: 'whatsapp' | 'email') => {
    const text = messageFor(invitation.token);

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    // `mailto:` se remet au client de messagerie : ouvert dans un onglet, il en
    // laisserait un vide derrière lui.
    window.location.href = `mailto:${invitation.email ?? ''}?subject=${encodeURIComponent(
      messages.shareSubject
    )}&body=${encodeURIComponent(text)}`;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onCancel} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{messages.inviteTitle}</ModalHeader>
        <ModalBody>
          <p className="text-small text-default-600">{messages.inviteIntro}</p>

          {/* Des radios plutôt qu'une liste déroulante : trois choix tiennent à
              l'écran, et une liste s'ouvrant dans une modale est refermée par
              elle au moment même où on l'ouvre. */}
          <RadioGroup
            size="sm"
            orientation="horizontal"
            label={messages.role}
            value={memberRoles[role].uid}
            onValueChange={(picked) => {
              const index = memberRoles.findIndex((entry) => entry.uid === picked);
              if (index >= 0) {
                setRole(index);
              }
            }}
          >
            {memberRoles.map((entry, index) => (
              <Radio key={entry.uid} value={entry.uid}>
                {roleLabel(index)}
              </Radio>
            ))}
          </RadioGroup>

          {/* `flex-wrap` plutôt qu'un point de rupture : la modale rétrécit avec
              la fenêtre, et ce qui compte est la place restante, pas la taille
              de l'écran. */}
          <div className="flex flex-wrap items-end gap-2">
            <Input
              size="sm"
              variant="bordered"
              type="email"
              label={messages.emailOptional}
              className="w-full min-w-[12rem] flex-1 sm:w-auto"
              value={email}
              onValueChange={setEmail}
            />

            <Button
              size="sm"
              color="primary"
              className="w-full shrink-0 sm:w-auto"
              startContent={<Plus size={16} />}
              isLoading={isCreating}
              onPress={onCreate}
            >
              {messages.create}
            </Button>
          </div>

          <p className="mt-2 font-bold">{messages.pending}</p>
          {invitations.length === 0 && <p className="text-small text-default-600">{messages.noPending}</p>}

          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className={`rounded-medium border-medium p-3 ${
                invitation.token === lastToken ? 'border-primary' : 'border-default-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1 basis-[12rem]">
                  <p className="truncate font-bold">{invitation.email || roleLabel(invitation.role)}</p>
                  <p className="text-tiny text-default-600">
                    {roleLabel(invitation.role)} · {messages.expiresOn}{' '}
                    {new Date(invitation.expiresAt).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    size="sm"
                    variant="bordered"
                    startContent={<MessageCircle size={16} />}
                    onPress={() => shareOn(invitation, 'whatsapp')}
                  >
                    {messages.shareWhatsapp}
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    startContent={<Mail size={16} />}
                    onPress={() => shareOn(invitation, 'email')}
                  >
                    {messages.shareEmail}
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    aria-label={messages.revoke}
                    onPress={() => onRevoke(invitation.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              {/* Le lien reste visible : un gestionnaire qui a fermé la fenêtre
                  sans partager doit pouvoir le reprendre, pas en refaire un. */}
              <Snippet
                size="sm"
                variant="flat"
                className="mt-2 w-full min-w-0"
                classNames={{ pre: 'min-w-0 overflow-hidden' }}
                symbol=""
                copyIcon={<Check size={14} />}
                tooltipProps={{ content: messages.copy }}
              >
                <span className="block truncate">{linkFor(invitation.token)}</span>
              </Snippet>
            </div>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant="light" onPress={onCancel}>
            {messages.close}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
