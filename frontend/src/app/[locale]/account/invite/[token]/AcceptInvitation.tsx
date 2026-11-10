'use client';
import { useContext, useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react';
import { useRouter } from '@/src/i18n/routing';
import { memberRoles } from '@/config/selection';
import { InvitationAcceptMessages, InvitationPreviewType } from '@/types/invitation';
import { TokenContext } from '@/utils/TokenProvider';
import { acceptInvitation, fetchInvitationPreview } from '@/utils/invitationsControl';
import { logError } from '@/utils/errorHandler';

const MIN_PASSWORD_LENGTH = 8;

type Props = {
  token: string;
  locale: string;
  messages: InvitationAcceptMessages;
};

export default function AcceptInvitation({ token, locale, messages }: Props) {
  const context = useContext(TokenContext);
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationPreviewType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function fetchDataEffect() {
      const preview = await fetchInvitationPreview(token);
      setInvitation(preview);
      setEmail(preview?.email ?? '');
      setIsLoading(false);
    }

    fetchDataEffect();
  }, [token]);

  const roleLabel = (index: number) => {
    const uid = memberRoles[index] ? memberRoles[index].uid : '';
    if (uid === 'manager') return messages.roleManager;
    if (uid === 'developer') return messages.roleDeveloper;
    return messages.roleReporter;
  };

  const onJoin = async () => {
    if (isJoining) {
      return;
    }

    const isSignedIn = context.isSignedIn();
    if (!isSignedIn) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setErrorMessage(messages.passwordTooShort);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(messages.passwordDoesNotMatch);
        return;
      }
    }

    setErrorMessage('');
    setIsJoining(true);
    try {
      const result = await acceptInvitation(
        token,
        isSignedIn ? context.token.access_token : null,
        isSignedIn ? undefined : { email, username, password }
      );

      // Le compte vient d'être créé : on ouvre la session avec le jeton rendu,
      // plutôt que de renvoyer quelqu'un se connecter à ce qu'il vient de
      // choisir.
      if (result.access_token) {
        const session = {
          access_token: result.access_token,
          expires_at: result.expires_at,
          user: result.user,
        };
        context.setToken(session);
        context.storeTokenToLocalStorage(session);
      }
      router.push(`/projects/${result.projectId}/home`, { locale: locale });
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : '';
      setErrorMessage(text.includes('already uses') ? messages.emailTaken : messages.acceptError);
      logError('Error accepting invitation:', error);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!invitation) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col justify-around">
        <Card className="w-[380px] md:w-[480px]">
          <CardHeader className="px-4 pt-4 pb-0">
            <h4 className="font-bold text-large">{messages.invalid}</h4>
          </CardHeader>
          <CardBody className="px-4 pt-2 pb-4">
            <p className="text-small text-default-600">{messages.invalidDetail}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const isSignedIn = context.isSignedIn();

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col justify-around">
      <Card className="w-[380px] md:w-[480px]">
        <CardHeader className="px-4 pt-4 pb-0">
          <h4 className="font-bold text-large">{messages.title}</h4>
        </CardHeader>
        <CardBody className="px-4 pt-2 pb-4">
          <p className="text-small">
            {invitation.projectName} · {messages.joinAs} {roleLabel(invitation.role)}
          </p>
          <p className="mt-1 text-small text-default-600">{isSignedIn ? messages.intro : messages.createAccount}</p>

          {errorMessage && <div className="my-3 text-danger">{errorMessage}</div>}

          {!isSignedIn && (
            <>
              <Input
                isRequired
                size="sm"
                type="email"
                variant="bordered"
                label={messages.email}
                value={email}
                onValueChange={setEmail}
                className="mt-3"
              />
              <Input
                isRequired
                size="sm"
                variant="bordered"
                label={messages.username}
                value={username}
                onValueChange={setUsername}
                className="mt-3"
              />
              <Input
                isRequired
                size="sm"
                type="password"
                variant="bordered"
                label={messages.password}
                value={password}
                onValueChange={setPassword}
                autoComplete="new-password"
                className="mt-3"
              />
              <Input
                isRequired
                size="sm"
                type="password"
                variant="bordered"
                label={messages.confirmPassword}
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                autoComplete="new-password"
                className="mt-3"
              />
            </>
          )}

          <div className="mt-4 flex justify-end">
            <Button size="sm" color="primary" isLoading={isJoining} onPress={onJoin}>
              {messages.join}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
