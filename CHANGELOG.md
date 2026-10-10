# Changelog

## 1.4.3

### Added
- `OPENAI_BASE_URL` and `AI_MODEL` (both optional) so the AI Writer works with any OpenAI-compatible provider, for example OpenRouter. Defaults: official OpenAI endpoint and `gpt-4o-mini`.
- `/writer` shows "AI generation needs an API key. See README." and disables Generate when no key is configured, instead of a raw error.
- README and documentation: environment table entries and a "Using another AI provider" section with an OpenRouter example.

## 1.4.2

### Security
- Upgraded `next-auth` to 5.0.0-beta.32 and `@auth/prisma-adapter` to 2.11.3 (pulls in `@auth/core` 0.41.3). Clears the critical and high Auth.js advisories reported by `npm audit`.
- Route protection is now enforced server-side in `middleware.ts`: unauthenticated requests to `/dashboard`, `/writer`, `/billing`, `/teams` get a 307 redirect to `/login`; unauthenticated requests to the protected `/api/*` routes get a 401 JSON response.

### Removed
- `lib/env.ts` (it was never imported). Environment variables are read directly, as documented in `.env.example`.
- The `AUTH_URL` alias (only the unused `lib/env.ts` mapped it); set `NEXTAUTH_URL`.
- A seller-specific comment in the billing page.

## 1.4.1

### Added
- Initial Prisma migration (`prisma/migrations/20261010000000_init`). Fresh databases are created with `npx prisma migrate deploy`.
- `npm run db:migrate` script.
- `package-lock.json` is now shipped; install with `npm ci`.
- Rewritten `README.md` and `documentation/Documentation.html` (identical content): requirements, environment table, feature → required keys, Neon/PostgreSQL setup, Google OAuth redirect URIs, Stripe webhook, Vercel deploy.

### Fixed
- Dev login (development only) now creates a real user row, so AI generations and subscriptions no longer fail on the user foreign key.
- `.env.example` now lists exactly the variables the code reads.

### Changed
- `prisma` and `@prisma/client` pinned to exactly `5.22.0`.
- Removed unused `GOOGLE_ID` / `GOOGLE_SECRET` fallbacks, `ENCRYPTION_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from the env handling (nothing read them).
- Removed the empty `documentation/index.html` and the packaging helper scripts from the buyer zip.
- `package.json` version set to 1.4.1.

## 1.4.0
- Initial public release of this build.
