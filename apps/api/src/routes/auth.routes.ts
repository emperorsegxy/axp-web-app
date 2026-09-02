import { Router } from 'express';
import { z } from 'zod';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { otpCodes, users } from '../db/schema.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { comparePassword, compareOtp, generateOtp, hashOtp, hashPassword } from '../lib/password.js';
import {
  clearSessionCookie,
  setSessionCookie,
  signResetToken,
  signSessionToken,
  verifyResetToken,
} from '../lib/jwt.js';
import { sendOtpEmail } from '../lib/mailer.js';

const router = Router();

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 45 * 1000;

function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    emailVerified: !!user.emailVerifiedAt,
  };
}

async function issueOtp(userId: string, email: string, purpose: 'signup_verify' | 'password_reset') {
  const code = generateOtp();
  const codeHash = await hashOtp(code);
  await db.insert(otpCodes).values({
    userId,
    purpose,
    codeHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });
  await sendOtpEmail(email, code, purpose);
}

const signupSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const body = signupSchema.parse(req.body);

    const [existing] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing) {
      throw new HttpError(409, 'An account with that email already exists.');
    }

    const passwordHash = await hashPassword(body.password);
    const [user] = await db
      .insert(users)
      .values({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        passwordHash,
      })
      .returning();

    await issueOtp(user.id, user.email, 'signup_verify');

    res.status(201).json({ email: user.email, cooldownSeconds: 45 });
  }),
);

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  purpose: z.enum(['signup_verify', 'password_reset']),
});

router.post(
  '/resend-otp',
  asyncHandler(async (req, res) => {
    const body = resendSchema.parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);

    // Don't reveal whether the account exists for password-reset resends.
    if (!user) {
      return res.json({ ok: true, cooldownSeconds: 45 });
    }

    const [recent] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, user.id),
          eq(otpCodes.purpose, body.purpose),
          gt(otpCodes.createdAt, new Date(Date.now() - OTP_RESEND_COOLDOWN_MS)),
        ),
      )
      .orderBy(otpCodes.createdAt)
      .limit(1);

    if (recent) {
      throw new HttpError(429, 'Please wait before requesting another code.');
    }

    await issueOtp(user.id, user.email, body.purpose);
    res.json({ ok: true, cooldownSeconds: 45 });
  }),
);

const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().length(6),
  purpose: z.enum(['signup_verify', 'password_reset']),
});

router.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const body = verifyOtpSchema.parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user) {
      throw new HttpError(400, 'That code isn’t right. Enter the most recent code we sent, or request a new one.');
    }

    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, user.id),
          eq(otpCodes.purpose, body.purpose),
          isNull(otpCodes.consumedAt),
          gt(otpCodes.expiresAt, new Date()),
        ),
      )
      .orderBy(otpCodes.createdAt)
      .limit(1);

    const invalid = () =>
      new HttpError(400, 'That code isn’t right. Enter the most recent code we sent, or request a new one.');

    if (!otp) throw invalid();

    if (otp.attempts >= 5) {
      throw new HttpError(429, 'Too many attempts. Request a new code.');
    }

    const matches = await compareOtp(body.code, otp.codeHash);
    if (!matches) {
      await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
      throw invalid();
    }

    await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id));

    if (body.purpose === 'signup_verify') {
      const [updated] = await db
        .update(users)
        .set({ emailVerifiedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
      const { token, maxAgeMs } = signSessionToken(
        { sub: updated.id, tokenVersion: updated.tokenVersion },
        true,
      );
      setSessionCookie(res, token, maxAgeMs);
      return res.json({ user: publicUser(updated) });
    }

    // password_reset: hand back a short-lived token to authorize the reset-password call.
    const resetToken = signResetToken(user.id);
    res.json({ resetToken });
  }),
);

const signinSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  remember: z.boolean().default(true),
});

router.post(
  '/signin',
  asyncHandler(async (req, res) => {
    const body = signinSchema.parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    const genericError = () =>
      new HttpError(401, "That email and password don't match our records. Check both and try again.");

    if (!user) throw genericError();
    const ok = await comparePassword(body.password, user.passwordHash);
    if (!ok) throw genericError();

    if (!user.emailVerifiedAt) {
      await issueOtp(user.id, user.email, 'signup_verify');
      return res.status(403).json({
        error: 'Please verify your email address first. We just sent you a new code.',
        needsVerification: true,
        email: user.email,
      });
    }

    const { token, maxAgeMs } = signSessionToken({ sub: user.id, tokenVersion: user.tokenVersion }, body.remember);
    setSessionCookie(res, token, maxAgeMs);
    res.json({ user: publicUser(user) });
  }),
);

const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() });

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const body = forgotSchema.parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (user && user.emailVerifiedAt) {
      await issueOtp(user.id, user.email, 'password_reset');
    }
    // Always the same response so we don't reveal whether the email is registered.
    res.json({ ok: true, cooldownSeconds: 45 });
  }),
);

const resetSchema = z.object({
  resetToken: z.string().min(10),
  password: z.string().min(8).max(200),
});

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const body = resetSchema.parse(req.body);
    let payload;
    try {
      payload = verifyResetToken(body.resetToken);
    } catch {
      throw new HttpError(400, 'This reset link has expired. Start over.');
    }

    const passwordHash = await hashPassword(body.password);
    const [updated] = await db
      .update(users)
      .set({ passwordHash, tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
      .where(eq(users.id, payload.sub))
      .returning();

    if (!updated) throw new HttpError(400, 'This reset link has expired. Start over.');

    const { token, maxAgeMs } = signSessionToken({ sub: updated.id, tokenVersion: updated.tokenVersion }, true);
    setSessionCookie(res, token, maxAgeMs);
    res.json({ user: publicUser(updated) });
  }),
);

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user) throw new HttpError(401, 'Not signed in.');
    res.json({ user: publicUser(user) });
  }),
);

export default router;
