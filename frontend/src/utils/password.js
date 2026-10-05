// Mirrors the Cognito user pool password policy in infrastructure/template.yaml.
export const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[a-z]/.test(p), label: 'A lowercase letter' },
  { test: (p) => /[A-Z]/.test(p), label: 'An uppercase letter' },
  { test: (p) => /\d/.test(p), label: 'A number' },
];

export const passwordMeetsRules = (password) => PASSWORD_RULES.every((rule) => rule.test(password));

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
