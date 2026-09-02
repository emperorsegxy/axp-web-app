import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../env.js';

export interface SessionPayload {
  sub: string;
  tokenVersion: number;
}

export interface ResetPayload {
  sub: string;
  purpose: 'password_reset';
}

const SESSION_MAX_AGE_MS = {
  remember: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  short: env.SESSION_TTL_DAYS_REMEMBER_OFF * 24 * 60 * 60 * 1000,
};

export function signSessionToken(payload: SessionPayload, remember: boolean) {
  const maxAgeMs = remember ? SESSION_MAX_AGE_MS.remember : SESSION_MAX_AGE_MS.short;
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: Math.floor(maxAgeMs / 1000) });
  return { token, maxAgeMs };
}

export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, env.JWT_SECRET) as SessionPayload;
}

export function setSessionCookie(res: Response, token: string, maxAgeMs: number) {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
}

export function signResetToken(userId: string) {
  return jwt.sign({ sub: userId, purpose: 'password_reset' } satisfies ResetPayload, env.JWT_RESET_SECRET, {
    expiresIn: '10m',
  });
}

export function verifyResetToken(token: string): ResetPayload {
  return jwt.verify(token, env.JWT_RESET_SECRET) as ResetPayload;
}
