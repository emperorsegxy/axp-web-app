import { z } from 'zod';

export type OtpPurpose = 'signup_verify' | 'password_reset';

const otpPurpose = z.enum(['signup_verify', 'password_reset']);
const email = z.string().trim().toLowerCase().email();

export const signupSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email,
  password: z.string().min(8).max(200),
});

export const resendOtpSchema = z.object({ email, purpose: otpPurpose });

export const verifyOtpSchema = z.object({
  email,
  code: z.string().length(6),
  purpose: otpPurpose,
});

export const signinSchema = z.object({
  email,
  password: z.string().min(1),
  remember: z.boolean().default(true),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(10),
  password: z.string().min(8).max(200),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
