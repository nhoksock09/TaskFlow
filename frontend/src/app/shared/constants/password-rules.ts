import { PasswordRequirement } from '@core/models';

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: 'minLength', label: 'PASSWORD_REQ.MIN_LENGTH', test: (v: string) => (v || '').length >= 8 },
  { id: 'uppercase', label: 'PASSWORD_REQ.UPPERCASE', test: (v: string) => /[A-Z]/.test(v || '') },
  { id: 'lowercase', label: 'PASSWORD_REQ.LOWERCASE', test: (v: string) => /[a-z]/.test(v || '') },
  { id: 'number', label: 'PASSWORD_REQ.NUMBER', test: (v: string) => /[0-9]/.test(v || '') },
];
