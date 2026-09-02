import 'dotenv/config';
import { z } from 'zod';

// z.coerce.boolean() coerces any non-empty string (including "false") to true,
// since it just calls Boolean(value) under the hood. Parse "true"/"false" text instead.
const boolFromEnv = (defaultValue: boolean) =>
  z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? defaultValue : v === 'true'));

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string(),

  JWT_SECRET: z.string().min(16),
  JWT_RESET_SECRET: z.string().min(16),
  SESSION_COOKIE_NAME: z.string().default('axp_session'),
  SESSION_TTL_DAYS: z.coerce.number().default(30),
  SESSION_TTL_DAYS_REMEMBER_OFF: z.coerce.number().default(1),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: boolFromEnv(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('AXP Mortgage <no-reply@axp.example.com>'),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_FORCE_PATH_STYLE: boolFromEnv(true),

  INTERNAL_ADMIN_SECRET: z.string().default(''),
});

export const env = schema.parse(process.env);
