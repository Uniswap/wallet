const PASSWORD_LENGTH_MIN = 8

export function isValidPassword(password: string): boolean {
  const patternWithMinLength = new RegExp(
    `^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>\-_+=~[\]\\\/]).{${PASSWORD_LENGTH_MIN},}$`
  );
  
  return patternWithMinLength.test(password);
}
