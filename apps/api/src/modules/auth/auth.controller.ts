import type { Request, Response } from 'express';
import { OTP_RESEND_COOLDOWN_SECONDS } from '../../config/constants.js';
import { clearSessionCookie, setSessionCookie } from '../../lib/jwt.js';
import { authService } from './auth.service.js';
import {
  forgotPasswordSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
  verifyOtpSchema,
} from './auth.schemas.js';

// Controllers only deal with HTTP: parse/validate input, call the service,
// shape the response. No database access here.
export const authController = {
  async signup(req: Request, res: Response) {
    const body = signupSchema.parse(req.body);
    const { email } = await authService.signup(body);
    res.status(201).json({ email, cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS });
  },

  async resendOtp(req: Request, res: Response) {
    const body = resendOtpSchema.parse(req.body);
    await authService.resendOtp(body);
    res.json({ ok: true, cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS });
  },

  async verifyOtp(req: Request, res: Response) {
    const body = verifyOtpSchema.parse(req.body);
    const result = await authService.verifyOtp(body);

    if (result.kind === 'session') {
      setSessionCookie(res, result.session.token, result.session.maxAgeMs);
      res.json({ user: result.user });
      return;
    }
    res.json({ resetToken: result.resetToken });
  },

  async signin(req: Request, res: Response) {
    const body = signinSchema.parse(req.body);
    const result = await authService.signin(body);

    if (result.kind === 'needs_verification') {
      res.status(403).json({
        error: 'Please verify your email address first. We just sent you a new code.',
        needsVerification: true,
        email: result.email,
      });
      return;
    }

    setSessionCookie(res, result.session.token, result.session.maxAgeMs);
    res.json({ user: result.user });
  },

  async forgotPassword(req: Request, res: Response) {
    const body = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(body.email);
    // Always the same response so we don't reveal whether the email is registered.
    res.json({ ok: true, cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS });
  },

  async resetPassword(req: Request, res: Response) {
    const body = resetPasswordSchema.parse(req.body);
    const { user, session } = await authService.resetPassword(body);
    setSessionCookie(res, session.token, session.maxAgeMs);
    res.json({ user });
  },

  logout(_req: Request, res: Response) {
    clearSessionCookie(res);
    res.json({ ok: true });
  },

  async me(req: Request, res: Response) {
    const user = await authService.getCurrentUser(req.userId!);
    res.json({ user });
  },
};
