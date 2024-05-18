"use client";
import React from "react";
import { useState } from "react";
import { Input, Button, Card, CardHeader, CardBody } from "@nextui-org/react";
import { Link } from "@/src/navigation";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { UserType, AuthMessages } from "@/types/user";
import { roles } from "@/config/selection";
import { signUp, signIn } from "./authControl";
import { isValidEmail, isValidPassword } from "./validate";
type Props = {
  isSignup: Boolean;
  messages: AuthMessages;
  locale: string;
};

export default function AuthPage({ isSignup, messages, locale }: Props) {
  const [user, setUser] = useState<UserType>({
    id: null,
    email: "",
    password: "",
    username: "",
    role: roles.findIndex((entry) => entry.uid === "user"),
    avatarPath: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const togglePasswordVisibility = () =>
    setIsPasswordVisible(!isPasswordVisible);

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
    if (isSignup) {
      const signUpRet = await signUp(user);
      console.log(signUpRet);
      // if success, move to signin page
    } else {
      const signInRet = await signIn(user);
      console.log(signInRet);
      // if success, move to account page
    }
  };

  return (
    <Card className="border-none bg-background/60 dark:bg-default-100/50 w-[480px]">
      <CardHeader className="px-4 pt-4 pb-0 flex justify-between">
        <h4 className="font-bold text-large">{messages.title}</h4>
        <Link href={isSignup ? "/auth/signin" : "/auth/signup"} locale={locale}>
          <Button
            color="primary"
            variant="light"
            endContent={<ChevronRight size={16} />}
          >
            {messages.linkTitle}
          </Button>
        </Link>
      </CardHeader>
      <CardBody className="overflow-visible px-4 pt-0 pb-4">
        <form>
          {errorMessage && (
            <div className="my-3 text-danger">{errorMessage}</div>
          )}
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
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="mt-3"
            type={isPasswordVisible ? "text" : "password"}
            endContent={
              <button
                className="focus:outline-none"
                type="button"
                onClick={togglePasswordVisibility}
              >
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
              type={isPasswordVisible ? "text" : "password"}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={togglePasswordVisibility}
                >
                  {isPasswordVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              }
              onChange={(e) => {
                setConfirmPassword(e.target.value);
              }}
            />
          )}
          <div className="flex justify-end">
            <Button color="primary" className="mt-3" onPress={validate}>
              {messages.submitTitle}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
