import type { NextFunction, Request, Response } from 'express';
import { env } from '../env.js';
import { HttpError } from '../http/http-error.js';

// Gates the internal reviewer-decision endpoint. Responds 404 (not 401/403) so
// the route is indistinguishable from one that doesn't exist when the secret is
// unset or wrong.
export function requireInternalSecret(req: Request, _res: Response, next: NextFunction) {
  if (
    !env.INTERNAL_ADMIN_SECRET ||
    req.header('x-internal-secret') !== env.INTERNAL_ADMIN_SECRET
  ) {
    return next(new HttpError(404, 'Not found.'));
  }
  next();
}
