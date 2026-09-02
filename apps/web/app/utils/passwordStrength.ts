export function getPasswordStrengthScore(pw: string) {
  let n = 0;
  if (pw.length >= 8) n++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) n++;
  if (/[\d\W]/.test(pw)) n++;
  return pw.length === 0 ? 0 : Math.max(1, n);
}

export const PASSWORD_STRENGTH_LABELS = [
  'Use 8 or more characters with a mix of letters and numbers.',
  'Weak — add length and a number or symbol.',
  'Fair — add a number or symbol to strengthen it.',
  'Strong password.',
];

export function isPasswordStrong(pw: string) {
  return pw.length >= 8 && getPasswordStrengthScore(pw) >= 2;
}
