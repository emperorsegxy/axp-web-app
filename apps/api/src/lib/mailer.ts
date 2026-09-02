import nodemailer from 'nodemailer';
import { env } from '../env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

export async function sendOtpEmail(to: string, code: string, purpose: 'signup_verify' | 'password_reset') {
  const subject =
    purpose === 'signup_verify' ? 'Confirm your AXP email address' : 'Reset your AXP password';
  const intro =
    purpose === 'signup_verify'
      ? 'Use this code to confirm your email address and finish creating your account.'
      : 'Use this code to confirm it’s you and reset your password.';

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text: `${intro}\n\nYour code: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: Poppins, Arial, sans-serif; color: #1A233D; max-width: 480px;">
        <div style="font-family: Georgia, serif; font-weight: 600; font-size: 20px; margin-bottom: 24px;">AXP</div>
        <p style="font-size: 15px; line-height: 1.6;">${intro}</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: .3em; margin: 24px 0; text-align: center;">${code}</div>
        <p style="font-size: 13px; color: #656A76; line-height: 1.6;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
