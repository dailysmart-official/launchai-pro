# Changelog

## 1.4.4

### Fixed
- `/billing` was a static placeholder: the "Demo UI — Connect Stripe Keys to Activate" badge and the disabled checkout button were hardcoded and never checked any environment variable. The page now shows the real plans and the current subscription, and checkout activates whenever `STRIPE_SECRET_KEY` is set on the server. The demo badge appears only when it is missing.
- Enterprise checkout used the Pro price. Enterprise now uses only `STRIPE_PRICE_ENTERPRISE`; without it the card shows "Contact sales" (when `SALES_CONTACT_URL` is set) or "Available on request", and never falls back to another plan's price.
- `customer.subscription.deleted` now always sets the subscription to `CANCELED` (falls back to the customer ID for rows saved without a subscription ID). `customer.subscription.updated` also stores the renewal date.
- `/pricing` and `/billing` show the checkout error message instead of silently stopping the spinner.
- AI Writer: provider errors are shown as clear messages — 404 "Model unavailable", 402 "No credits", 429 "Rate limited", 401/403 "API key rejected". Raw provider error text is no longer sent to the browser (logged server-side).

### Added
- `AI_FALLBACK_MODELS` (optional, comma-separated): when the AI provider returns 429 (rate limited) or 404 (model not found), each fallback model is tried once, in order.
- "Manage billing" button on `/billing` for subscribed users, opening the Stripe Customer Portal.
- `STRIPE_PRICE_ENTERPRISE` and `SALES_CONTACT_URL` (both optional).
- "Preview — demo data, not connected to the database" badge on the Teams page, the API Keys section and the Credits widget.
- README / documentation: exact Stripe variable names (no `NEXT_PUBLIC_*` or publishable key needed), the exact webhook event list, and a note that OpenRouter model slugs change (https://openrouter.ai/models).

### Removed
- Inaccurate "keys are SHA-256 hashed" text and the fake `sk_live_****` / `sk_test_****` keys on the Teams page; "Generate New Key" is disabled in the preview. `GET /api/api-keys` now returns an empty list and `POST /api/api-keys` returns 501 instead of a fake key.
- Developer notes visible to end users: on `/billing` ("Route /billing is now live — previously 404. Wire getStripeSession from lib/stripe.ts…"), `/teams` ("Stateless v1.4.0 — invites & keys mocked…"), `/dashboard` ("Analytics range defaults to 7d… Team & API Keys deferred to v1.3.1") and the usage chart ("replace with Recharts for CodeCanyon preview").

### Changed
- Team invite form says "Preview only — invitations are not sent yet." instead of claiming an invite was sent.
- Starter button reads "Get Starter" (no trial is configured).

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
