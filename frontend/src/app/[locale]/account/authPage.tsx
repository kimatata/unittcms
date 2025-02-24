'use client';
import React from 'react';
import { useState, useContext } from 'react';
import { Input, Button, Card, CardHeader, CardBody } from '@heroui/react';
import { Link } from '@/src/i18n/routing';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { UserType, AuthMessages } from '@/types/user';
import { roles } from '@/config/selection';
import { signUp, signIn, signInAsGuest } from './authControl';
import { isValidEmail, isValidPassword } from './validate';
import { TokenContext } from '@/utils/TokenProvider';
import { useRouter } from '@/src/i18n/routing';
import Config from '@/config/config';
import { LocaleCodeType } from '@/types/locale';
const isDemoSite = Config.isDemoSite;

type Props = {
  isSignup: boolean;
  messages: AuthMessages;
  locale: LocaleCodeType;
};

export default function AuthPage({ isSignup, messages, locale }: Props) {
  const router = useRouter();
  const context = useContext(TokenContext);
  const [user, setUser] = useState<UserType>({
    id: null,
    email: '',
    password: '',
    username: '',
    role: roles.findIndex((entry) => entry.uid === 'user'),
    avatarPath: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  const validate = async () => {
    if (!isValidEmail(user.email)) {
      setErrorMessage(messages.invalidEmail);
      return;
    }

    if (!isValidPassword(user.password)) {
      setErrorMessage(messages.invalidPassword);
      return;
    }

    if (isSignup) {
      if (!user.username) {
        setErrorMessage(messages.usernameEmpty);
        return;
      }

      if (user.password !== confirmPassword) {
        setErrorMessage(messages.passwordDoesNotMatch);
        return;
      }
    }

    await submit();
  };

  const submit = async () => {
    let token;
    if (isSignup) {
      try {
        token = await signUp(user);
      } catch {
        setErrorMessage(messages.signupError);
        return;
      }
    } else {
      try {
        token = await signIn(user);
      } catch {
        setErrorMessage(messages.signinError);
        return;
      }
    }

    context.setToken(token);
    context.storeTokenToLocalStorage(token);
    router.push('/account', { locale: locale });
  };

  const handleSignInAsGuest = async () => {
    const token = await signInAsGuest();
    context.setToken(token);
    context.storeTokenToLocalStorage(token);
    router.push('/account', { locale: locale });
  };

  return (
    <Card className="w-[480px] mt-16">
      <CardHeader className="px-4 pt-4 pb-0 flex justify-between">
        <h4 className="font-bold text-large">{messages.title}</h4>
        <Link href={isSignup ? '/account/signin' : '/account/signup'} locale={locale}>
          <Button color="primary" variant="light" endContent={<ChevronRight size={16} />}>
            {messages.linkTitle}
          </Button>
        </Link>
      </CardHeader>
      <CardBody className="overflow-visible px-4 pt-0 pb-4">
        <form>
          {errorMessage && <div className="my-3 text-danger">{errorMessage}</div>}
          <Input
            isRequired
            type="email"
            label={messages.email}
            autoComplete="email"
            className="mt-3"
            onChange={(e) => {
              setUser({
                ...user,
                email: e.target.value,
              });
            }}
          />
          {isSignup && (
            <Input
              isRequired
              type="username"
              label={messages.username}
              autoComplete="username"
              className="mt-3"
              onChange={(e) => {
                setUser({
                  ...user,
                  username: e.target.value,
                });
              }}
            />
          )}
          <Input
            label={messages.password}
            variant="bordered"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            className="mt-3"
            type={isPasswordVisible ? 'text' : 'password'}
            endContent={
              <button className="focus:outline-none" type="button" onClick={togglePasswordVisibility}>
                {isPasswordVisible ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            }
            onChange={(e) => {
              setUser({
                ...user,
                password: e.target.value,
              });
            }}
          />
          {isSignup && (
            <Input
              label={messages.confirmPassword}
              variant="bordered"
              autoComplete="new-password"
              className="mt-3"
              type={isPasswordVisible ? 'text' : 'password'}
              endContent={
                <button className="focus:outline-none" type="button" onClick={togglePasswordVisibility}>
                  {isPasswordVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              }
              onChange={(e) => {
                setConfirmPassword(e.target.value);
              }}
            />
          )}

          {isDemoSite && <div className="my-3 text-default-600">{messages.demoPageWarning}</div>}

          <div className="flex justify-end items-center mt-3">
            <Button color="primary" onPress={validate}>
              {messages.submitTitle}
            </Button>
            {!isSignup && isDemoSite && (
              <Button
                className="ms-3 bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                onPress={handleSignInAsGuest}
              >
                {messages.signInAsGuest}
              </Button>
            )}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
