import bcrypt from 'bcryptjs';

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(code: string) {
  return bcrypt.hash(code, 8);
}

export function compareOtp(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}
