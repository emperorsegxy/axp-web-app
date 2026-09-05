import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import authRoutes from './modules/auth/auth.routes.js';
import kycRoutes from './modules/kyc/kyc.routes.js';
import { errorHandler } from './http/error-handler.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/kyc', kycRoutes);

  app.use(errorHandler);

  return app;
}
