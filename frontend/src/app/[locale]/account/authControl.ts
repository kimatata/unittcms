import { UserType } from "@/types/user";
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
    const accessToken = await response.json();
    storeToken(accessToken);
    return accessToken;
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
    const accessToken = await response.json();
    storeToken(accessToken);
    return accessToken;
  } catch (error: any) {
    console.error("Error sign in:", error);
    throw error;
  }
}

function storeToken(accessToken: Object) {
  localStorage.setItem("testplat-auth-token", JSON.stringify(accessToken));
}

function signOut() {
  localStorage.removeItem("testplat-auth-token");
}

export { signUp, signIn, signOut };
