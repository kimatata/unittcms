function isValidEmail(email: string) {
  const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (email.match(validRegex)) {
    return true;
  } else {
    return false;
  }
}

function isValidPassword(password: string) {
  if (password.length > 7) {
    return true;
  } else {
    return false;
  }
}

export { isValidEmail, isValidPassword };
