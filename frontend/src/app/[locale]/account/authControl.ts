import { UserType } from "@/types/user";
import { avatars } from "@/config/selection";
import Config from "@/config/config";
const apiServer = Config.apiServer;

async function signUp(newUser: UserType) {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newUser),
  };

  const url = `${apiServer}/auth/signup`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const token = await response.json();
    return token;
  } catch (error: any) {
    console.error("Error sign up:", error);
    throw error;
  }
}

async function signIn(signInUser: UserType) {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signInUser),
  };

  const url = `${apiServer}/auth/signin`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const token = await response.json();
    return token;
  } catch (error: any) {
    console.error("Error sign in:", error);
    throw error;
  }
}

function getRandomAvatarPath() {
  const randomIndex = Math.floor(Math.random() * avatars.length);
  return avatars[randomIndex];
}

export { signUp, signIn, getRandomAvatarPath };
