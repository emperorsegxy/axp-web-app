import type { NextFunction, Request, Response } from 'express';

type RouteHandler = (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>;

// Wraps a controller method so a rejected promise is forwarded to Express's
// error middleware instead of becoming an unhandled rejection.
export function asyncHandler(fn: RouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
