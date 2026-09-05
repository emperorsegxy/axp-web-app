import type { NextFunction, Request, Response } from 'express';
import { env } from '../env.js';
import { authService } from '../modules/auth/auth.service.js';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

// Turns the session cookie into `req.userId`. The actual lookup and
// token-version check live in the auth service, not here.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Not signed in.' });
  }
  try {
    req.userId = await authService.resolveSession(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}
