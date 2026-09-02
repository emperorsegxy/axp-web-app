# AXP API

Express + TypeScript backend for the AXP mortgage app: auth (JWT httpOnly cookie
sessions) and borrower KYC document upload/review state.

## Stack

- Express, TypeScript
- PostgreSQL via Drizzle ORM
- Nodemailer (SMTP) for OTP email delivery
- S3-compatible object storage (`@aws-sdk/client-s3`) for KYC documents

## Setup

```bash
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, SMTP, S3 creds
npm install
npm run db:generate    # regenerate SQL migrations after schema.ts changes
npm run db:migrate     # apply migrations
npm run dev            # http://localhost:4000
```

## Notes

- `POST /api/kyc/:submissionId/decision` simulates a reviewer decision
  (approve / reject / needs-correction) so the four borrower status states are
  reachable end-to-end. It's gated behind the `INTERNAL_ADMIN_SECRET` header
  (`x-internal-secret`) and returns 404 if that env var is unset — there is no
  admin review UI in this build (explicitly out of scope), so use this route
  directly (curl/Postman) or build the admin queue against it later.
- Passwords are hashed with bcrypt; OTP codes are hashed and rate-limited
  (45s resend cooldown, 5 verification attempts, 10 minute expiry).
- Resetting a password bumps the user's `tokenVersion`, invalidating any other
  active session cookies.
