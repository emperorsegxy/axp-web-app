import { HttpError } from '../../http/http-error.js';
import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
} from '../../config/constants.js';
import {
  comparePassword,
  compareOtp,
  generateOtp,
  hashOtp,
  hashPassword,
} from '../../lib/password.js';
import {
  signResetToken,
  signSessionToken,
  verifyResetToken,
  verifySessionToken,
} from '../../lib/jwt.js';
import { sendOtpEmail } from '../../lib/mailer.js';
import { authRepository } from './auth.repository.js';
import { toPublicUser, type PublicUser } from './auth.serializer.js';
import type {
  OtpPurpose,
  ResendOtpInput,
  ResetPasswordInput,
  SigninInput,
  SignupInput,
  VerifyOtpInput,
} from './auth.schemas.js';

type SignedSession = ReturnType<typeof signSessionToken>;

export type VerifyOtpResult =
  | { kind: 'session'; user: PublicUser; session: SignedSession }
  | { kind: 'reset'; resetToken: string };

export type SigninResult =
  | { kind: 'session'; user: PublicUser; session: SignedSession }
  | { kind: 'needs_verification'; email: string };

const invalidOtpError = () =>
  new HttpError(
    400,
    'That code isn’t right. Enter the most recent code we sent, or request a new one.',
  );

async function issueOtp(userId: string, email: string, purpose: OtpPurpose) {
  const code = generateOtp();
  const codeHash = await hashOtp(code);
  await authRepository.insertOtp({
    userId,
    purpose,
    codeHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });
  await sendOtpEmail(email, code, purpose);
}

export const authService = {
  async signup(input: SignupInput): Promise<{ email: string }> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new HttpError(409, 'An account with that email already exists.');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
    });

    await issueOtp(user.id, user.email, 'signup_verify');
    return { email: user.email };
  },

  async resendOtp(input: ResendOtpInput): Promise<void> {
    const user = await authRepository.findUserByEmail(input.email);
    // Don't reveal whether the account exists.
    if (!user) return;

    const recent = await authRepository.findRecentOtp(
      user.id,
      input.purpose,
      new Date(Date.now() - OTP_RESEND_COOLDOWN_MS),
    );
    if (recent) {
      throw new HttpError(429, 'Please wait before requesting another code.');
    }

    await issueOtp(user.id, user.email, input.purpose);
  },

  async verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw invalidOtpError();

    const otp = await authRepository.findActiveOtp(user.id, input.purpose);
    if (!otp) throw invalidOtpError();

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpError(429, 'Too many attempts. Request a new code.');
    }

    const matches = await compareOtp(input.code, otp.codeHash);
    if (!matches) {
      await authRepository.incrementOtpAttempts(otp.id, otp.attempts);
      throw invalidOtpError();
    }

    await authRepository.consumeOtp(otp.id);

    if (input.purpose === 'signup_verify') {
      const updated = await authRepository.markEmailVerified(user.id);
      const session = signSessionToken(
        { sub: updated.id, tokenVersion: updated.tokenVersion },
        true,
      );
      return { kind: 'session', user: toPublicUser(updated), session };
    }

    // password_reset: hand back a short-lived token to authorize the reset-password call.
    return { kind: 'reset', resetToken: signResetToken(user.id) };
  },

  async signin(input: SigninInput): Promise<SigninResult> {
    const genericError = () =>
      new HttpError(
        401,
        "That email and password don't match our records. Check both and try again.",
      );

    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw genericError();

    const ok = await comparePassword(input.password, user.passwordHash);
    if (!ok) throw genericError();

    if (!user.emailVerifiedAt) {
      await issueOtp(user.id, user.email, 'signup_verify');
      return { kind: 'needs_verification', email: user.email };
    }

    const session = signSessionToken(
      { sub: user.id, tokenVersion: user.tokenVersion },
      input.remember,
    );
    return { kind: 'session', user: toPublicUser(user), session };
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await authRepository.findUserByEmail(email);
    if (user && user.emailVerifiedAt) {
      await issueOtp(user.id, user.email, 'password_reset');
    }
    // Caller always responds identically so the email's registration status stays hidden.
  },

  async resetPassword(
    input: ResetPasswordInput,
  ): Promise<{ user: PublicUser; session: SignedSession }> {
    let payload;
    try {
      payload = verifyResetToken(input.resetToken);
    } catch {
      throw new HttpError(400, 'This reset link has expired. Start over.');
    }

    const passwordHash = await hashPassword(input.password);
    const updated = await authRepository.updatePasswordAndBumpTokenVersion(
      payload.sub,
      passwordHash,
    );
    if (!updated) throw new HttpError(400, 'This reset link has expired. Start over.');

    const session = signSessionToken(
      { sub: updated.id, tokenVersion: updated.tokenVersion },
      true,
    );
    return { user: toPublicUser(updated), session };
  },

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new HttpError(401, 'Not signed in.');
    return toPublicUser(user);
  },

  // Used by the requireAuth middleware to turn a cookie into a user id.
  async resolveSession(token: string): Promise<string> {
    const payload = verifySessionToken(token);
    const user = await authRepository.findUserById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new Error('Invalid session.');
    }
    return user.id;
  },
};
