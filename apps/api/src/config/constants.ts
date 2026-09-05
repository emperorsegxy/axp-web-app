// Shared domain constants. Timings and enumerations that more than one layer needs.

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 45 * 1000;
export const OTP_RESEND_COOLDOWN_SECONDS = OTP_RESEND_COOLDOWN_MS / 1000;
export const OTP_MAX_ATTEMPTS = 5;

export const KYC_DOCUMENT_SLOTS = ['identity', 'work', 'address'] as const;
export const KYC_EDITABLE_STATUSES = ['draft', 'needs_correction'] as const;
