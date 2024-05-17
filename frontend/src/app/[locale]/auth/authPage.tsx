"use client";
import React from "react";
import { useState, useEffect } from "react";
import { Input, Button } from "@nextui-org/react";
import { Eye, EyeOff } from "lucide-react";
import { UserType, AuthMessages } from "@/types/user";
import { roles } from "@/config/selection";
import { usePathname } from "next/navigation";
import { signUp, signIn } from "./authControl";
type Props = {
  messages: AuthMessages;
  locale: string;
};

export default function AuthPage({ messages, locale }: Props) {
  const [isSignup, setIsSignup] = useState(false);
  const pathname = usePathname();
  console.log(pathname);
  if (pathname.includes("signup")) {
    setIsSignup(true);
  }

  const [user, setUser] = useState<UserType>({
    id: null,
    email: "",
    password: "",
    username: "",
    role: roles.findIndex((entry) => entry.uid === "user"),
    avatarPath: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const togglePasswordVisibility = () =>
    setIsPasswordVisible(!isPasswordVisible);

  const validate = async () => {
    if (!user.email) {
      setErrorMessage("email can't be empty");
      return;
    }

    if (!user.password) {
      setErrorMessage("password can't be empty");
      return;
    }

    if (!user.username) {
      setErrorMessage("username can't be empty");
      return;
    }

    await submit();
  };

  const submit = async () => {
    if (isSignup) {
      const signUpRet = await signUp(user);
      console.log(signUpRet);
      // if success, move to signin page
    } else {
      const signInRet = await signUp(user);
      console.log(signInRet);
      // if success, move to account page
    }
  };

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
      <Input
        isRequired
        type="email"
        label="Email"
        onChange={(e) => {
          setUser({
            ...user,
            email: e.target.value,
          });
        }}
      />
      <Input
        isRequired
        type="username"
        label="User Name"
        onChange={(e) => {
          setUser({
            ...user,
            username: e.target.value,
          });
        }}
      />
      <Input
        label="Password"
        variant="bordered"
        placeholder="Enter your password"
        endContent={
          <button
            className="focus:outline-none"
            type="button"
            onClick={togglePasswordVisibility}
          >
            {isPasswordVisible ? <Eye size={24} /> : <EyeOff size={24} />}
          </button>
        }
        type={isPasswordVisible ? "text" : "password"}
        onChange={(e) => {
          setUser({
            ...user,
            password: e.target.value,
          });
        }}
        className="max-w-xs"
      />
      <Button color="primary" onPress={validate}>
        {isSignup ? messages.signup : messages.signin}
      </Button>
    </div>
    // <Modal
    //   isOpen={isOpen}
    //   onOpenChange={() => {
    //     onCancel();
    //   }}
    // >
    //   <ModalContent>
    //     <ModalHeader className="flex flex-col gap-1">
    //       {messages.project}
    //     </ModalHeader>
    //     <ModalBody>
    //       <Input
    //         type="text"
    //         label={messages.projectName}
    //         value={projectName.text}
    //         isInvalid={projectName.isValid}
    //         errorMessage={projectName.errorMessage}
    // onChange={(e) => {
    //   setProjectName({
    //     ...projectName,
    //     text: e.target.value,
    //   });
    // }}
    //       />
    //       <Textarea
    //         label={messages.projectDetail}
    //         value={projectDetail.text}
    //         isInvalid={projectDetail.isValid}
    //         errorMessage={projectDetail.errorMessage}
    //         onChange={(e) => {
    //           setProjectDetail({
    //             ...projectDetail,
    //             text: e.target.value,
    //           });
    //         }}
    //       />
    //     </ModalBody>
    //     <ModalFooter>
    //       <Button variant="light" onPress={onCancel}>
    //         {messages.close}
    //       </Button>
    //       <Button color="primary" onPress={validate}>
    //         {editingProject ? messages.update : messages.create}
    //       </Button>
    //     </ModalFooter>
    //   </ModalContent>
    // </Modal>
  );
}
