import type { Request, Response, NextFunction } from 'express';
import { env } from '../env.js';
import { verifySessionToken } from '../lib/jwt.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Not signed in.' });
  }
  try {
    const payload = verifySessionToken(token);
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    req.userId = user.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}
