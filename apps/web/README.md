# AXP Web

Nuxt 4 frontend implementing the `Auth.dc.html` and `Borrower KYC.dc.html`
Claude Design prototypes (see `../../chats/chat1.md` for the design brief).

## Setup

```bash
npm install
NUXT_API_ORIGIN=http://localhost:4000 npm run dev   # http://localhost:3000
```

`/api/**` requests are proxied to the Express API (`NUXT_API_ORIGIN`, default
`http://localhost:4000`) via `routeRules` in `nuxt.config.ts`, so the session
cookie stays same-origin — no CORS/credentials juggling needed.

## Structure

- `app/pages/auth/*` — sign in, sign up, email OTP, forgot/reset password, success
- `app/pages/kyc/*` — 3-step upload wizard, status card (4 states), read-only review
- `app/composables/useAuth.ts`, `useKyc.ts` — API-backed state (Nuxt `useState`)
- `app/components/auth/*`, `app/components/kyc/*` — shared UI pieces
- `app/assets/css/main.css` — AXP design tokens (navy `#1A233D` / gold `#D4A02A`,
  Lora + Poppins)
