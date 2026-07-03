export interface PasswordPolicy {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
}

export function validatePassword(password: string, policy: PasswordPolicy): string[] {
  const errors: string[] = [];
  if (password.length < policy.passwordMinLength) {
    errors.push(`Password must be at least ${policy.passwordMinLength} characters long.`);
  }
  if (policy.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (policy.passwordRequireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (policy.passwordRequireSymbol && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one symbol.');
  }
  return errors;
}
