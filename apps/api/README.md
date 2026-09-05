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

## Structure

Each feature lives under `src/modules/<feature>/` as a layered slice:

| Layer | File | Rule |
| --- | --- | --- |
| Router | `*.routes.ts` | Maps paths to controller methods, applies middleware |
| Controller | `*.controller.ts` | HTTP only — parse/validate (`*.schemas.ts`), call the service, shape the response. **Never touches the DB.** |
| Service | `*.service.ts` | Business logic and orchestration. Calls repositories + `lib/*` (mailer, s3, jwt, hashing). |
| Repository | `*.repository.ts` | **The only layer that imports `db`/Drizzle.** All queries live here. |
| Serializer | `*.serializer.ts` | DB record → client-facing shape |

Shared pieces: `src/http/` (error class, async wrapper, error handler), `src/middleware/`
(`requireAuth` resolves the session cookie via the auth service; `requireInternalSecret`
gates the reviewer-decision route), `src/config/constants.ts`, `src/lib/*` (infra helpers),
`src/app.ts` (Express app factory; `index.ts` just calls `.listen`).

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
