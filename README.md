# LaunchAI Pro

Next.js 15 AI SaaS starter: Google login (Auth.js), PostgreSQL + Prisma, an OpenAI-powered AI Writer, and Stripe subscriptions.

## Requirements

- Node.js 18.18 or newer (20 LTS recommended) and npm 9+
- A PostgreSQL database (Neon, Supabase or local)
- Optional, per feature: Google OAuth client, OpenAI API key, Stripe account (see "Feature → required keys")

## Quick start (local)

```bash
npm ci
cp .env.example .env      # Windows: copy .env.example .env
# edit .env: set DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL (see below)
npx prisma migrate deploy
npm run dev               # http://localhost:3000
```

`npm ci` installs the exact versions in `package-lock.json` and does not need `--legacy-peer-deps`. It also runs `prisma generate` automatically.

Never commit `.env`.

## Environment variables

| Variable | Required | What it is | Where to get it |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | Neon/Supabase dashboard; add `?sslmode=require` for hosted databases |
| `AUTH_SECRET` | Yes | Signs session tokens | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Public URL of the app | `http://localhost:3000` locally, your domain on Vercel |
| `AUTH_GOOGLE_ID` | For Google login | Google OAuth client ID | Google Cloud Console → APIs & Services → Credentials |
| `AUTH_GOOGLE_SECRET` | For Google login | Google OAuth client secret | Same place |
| `OPENAI_API_KEY` | For AI Writer | API key for OpenAI or any OpenAI-compatible provider | platform.openai.com → API keys, or your provider's dashboard (e.g. openrouter.ai/keys) |
| `OPENAI_BASE_URL` | No | API base URL. Leave empty for OpenAI | Your provider's docs, e.g. `https://openrouter.ai/api/v1` |
| `AI_MODEL` | No | Model name sent to the provider. Default `gpt-4o-mini` | Your provider's model list, e.g. `openai/gpt-4o-mini` on OpenRouter |
| `AI_FALLBACK_MODELS` | No | Comma-separated models tried in order when `AI_MODEL` returns 429 or 404 | Same model list |
| `STRIPE_SECRET_KEY` | For billing | Stripe secret key (`sk_...`) | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | For billing | Webhook signing secret (`whsec_...`) | Stripe Dashboard → Webhooks (or `stripe listen` locally) |
| `STRIPE_PRICE_STARTER` | For billing | Price ID of the Starter plan (`price_...`) | Stripe Dashboard → Product catalog |
| `STRIPE_PRICE_PRO` | For billing | Price ID of the Pro plan (`price_...`) | Same place |
| `STRIPE_PRICE_ENTERPRISE` | No | Price ID of the Enterprise plan. If empty, Enterprise is not sold online | Same place |
| `SALES_CONTACT_URL` | No | Enterprise "Contact sales" link, `https://...` or `mailto:...`. If empty, the card shows "Available on request" | Your contact page or sales email |

All Stripe variables are read on the server at request time. No `NEXT_PUBLIC_*` variable and no publishable key are needed (checkout redirects to the Stripe-hosted page). After changing them on Vercel, redeploy.

Accepted aliases, useful when a host already defines them: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (for `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`), `NEXTAUTH_SECRET` (for `AUTH_SECRET`). Set either name, not both.

## Feature → required keys

| Feature | Needs |
|---|---|
| Pages `/`, `/pricing`, `/login`, `/register` | `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` |
| Dev login (local only) | the three above, `npm run dev` |
| Google login | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| AI Writer (`/writer`, history, `/api/ai/generate`) | login, `DATABASE_URL`, `OPENAI_API_KEY` |
| Billing (`/billing`, checkout) | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO` (optional `STRIPE_PRICE_ENTERPRISE`, `SALES_CONTACT_URL`) |
| Subscription sync (webhook) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

Without `OPENAI_API_KEY` the `/writer` page shows the notice "AI generation needs an API key. See README." and disables the Generate button; the API returns HTTP 503. Without `STRIPE_SECRET_KEY`, `/billing` shows the badge "Demo UI — Connect Stripe Keys to Activate"; checkout in development redirects to the dashboard with a mock success, and in production it shows "Billing is not configured".

## Using another AI provider (OpenRouter and others)

The AI Writer uses the OpenAI SDK, so it works with any OpenAI-compatible provider. Set the key, the base URL and a model name from that provider. Example for OpenRouter:

```
OPENAI_API_KEY="sk-or-..."
OPENAI_BASE_URL="https://openrouter.ai/api/v1"
AI_MODEL="openai/gpt-4o-mini"
```

Leave `OPENAI_BASE_URL` and `AI_MODEL` empty to use OpenAI with `gpt-4o-mini`. Restart the server after changing them.

OpenRouter model slugs change over time, especially the free (`:free`) ones. If `/writer` shows "Model unavailable", pick a current slug from https://openrouter.ai/models and update `AI_MODEL`.

To keep `/writer` working when a model is rate limited (429) or removed (404), list backup models in `AI_FALLBACK_MODELS`, separated by commas. Each one is tried once, in order; other errors are not retried:

```env
AI_FALLBACK_MODELS="nvidia/nemotron-3-super-120b-a12b:free,inclusionai/ling-3.1-flash"
```

The example uses free models only. Paid models via OpenRouter (for example `openai/gpt-4o-mini`) need credits on your OpenRouter account; without credits they fail with "No credits".

Provider errors are shown in `/writer` as clear messages: 404 → "Model unavailable", 402 → "No credits", 429 → "Rate limited", 401/403 → API key rejected.

## Database setup (Neon / PostgreSQL)

1. Create a project at neon.tech (or any PostgreSQL provider) and copy the connection string.
2. Put it in `.env` as `DATABASE_URL`.
3. Create the tables:

```bash
npx prisma migrate deploy
```

This applies the migration in `prisma/migrations/`. Use `npm run db:studio` to browse the data.

**Existing database created earlier with `prisma db push`?** Mark the initial migration as applied once, instead of running `migrate deploy`:

```bash
npx prisma migrate resolve --applied 20261010000000_init
```

**Neon users:** run `prisma migrate` commands with Neon's *direct* connection string (the host without `-pooler`). Pooled connections can hold Prisma's migration lock or keep stale session settings and cause "advisory lock" timeouts. The pooled string is fine for the running app, so you can use the pooled URL in Vercel and the direct one only on your computer when migrating.

If you change `prisma/schema.prisma`, create a new migration with `npx prisma migrate dev --name your_change` against a development database. Do not run `migrate dev` against production.

## Dev login (development only)

When started with `npm run dev`, the login page offers a "Dev Login" form so you can try the app without Google keys:

- Email: `dev@launchai.pro`
- Password: `dev1234`

On first login this creates a matching user row in the database. The provider is only registered when `NODE_ENV` is `development`, so it is not available in `npm run build && npm start` or on Vercel. Change or remove it in `lib/auth.ts` if you ship a fork.

## Google OAuth

1. Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.
2. Authorized redirect URIs, add both:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-DOMAIN/api/auth/callback/google` (for example `https://your-app.vercel.app/api/auth/callback/google`)
3. Copy the client ID and secret into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
4. `NEXTAUTH_URL` must match the domain you are opening. `invalid_client` means the ID or secret is missing or wrong; `redirect_uri_mismatch` means the URI above is not registered.

## Stripe

1. Create recurring prices in Stripe (Starter and Pro, optionally Enterprise) and put their IDs in `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO` and `STRIPE_PRICE_ENTERPRISE`.
2. Put your secret key in `STRIPE_SECRET_KEY`. Use test keys (`sk_test_...`) until you are ready to go live.
3. Webhook endpoint: `https://YOUR-DOMAIN/api/webhooks/stripe`. Subscribe to exactly these events (the handler ignores all others):
   - `checkout.session.completed` — marks the subscription active
   - `customer.subscription.updated` — syncs status, price and renewal date
   - `customer.subscription.deleted` — downgrades the user (status `CANCELED`)
4. Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`.
   The "Manage billing" button on `/billing` opens the Stripe Customer Portal. Activate it once in Stripe Dashboard → Settings → Billing → Customer portal (separately for test and live mode).
5. Local testing with the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI prints a `whsec_...` secret; use it as `STRIPE_WEBHOOK_SECRET` locally.

## Deploy to Vercel

1. Push the project to a Git repository and import it in Vercel (framework: Next.js; defaults are fine).
2. In Project Settings → Environment Variables, add every variable you need from the table above. Set `NEXTAUTH_URL` to your production URL.
3. Create the database tables once, from your computer, with `DATABASE_URL` pointing at the production database:

```bash
npx prisma migrate deploy
```

4. Deploy. Vercel runs `npm install`, which triggers `prisma generate`, then `next build`.
5. Add the production redirect URI in Google Cloud and the production webhook in Stripe (sections above).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:push` | `prisma db push` (prototyping only) |
| `npm run db:studio` | Prisma Studio |

## Project structure

```
app/            Routes: (marketing), (auth), (dashboard), api/
components/     UI components
features/       Billing, team, analytics logic
modules/        AI Writer service and UI
lib/            auth, db, openai, stripe, env helpers
prisma/         schema.prisma and migrations/
documentation/  Documentation.html (same content as this file)
```

## Troubleshooting

- **Build prints "[auth] Missing Google OAuth credentials"**: a warning only; set the Google variables to remove it.
- **`/writer` redirects to `/login`**: expected when signed out.
- **Dev console shows "headers() should be awaited" errors**: a known warning from `next-auth` 5.0.0-beta.19 in development only; the pages still work and it does not occur in production builds.
- **"Timed out trying to acquire a postgres advisory lock"**: use the direct (non-pooler) database URL for `prisma migrate`, see "Database setup".
- **`P3005 The database schema is not empty`**: the database was created with `db push`; run the `migrate resolve --applied` command from "Database setup" once.
- **Database errors on first load**: run `npx prisma migrate deploy` and check `DATABASE_URL`.
- **AI Writer shows "needs an API key" or returns 503**: `OPENAI_API_KEY` is missing.
- **AI Writer shows "Model unavailable"**: `AI_MODEL` is not a valid model at your provider; on OpenRouter check https://openrouter.ai/models.
- **AI Writer shows "No credits" or "Rate limited"**: add credits at your provider or wait and retry. Free models are often rate limited; set `AI_FALLBACK_MODELS`.
- **`/billing` shows "Demo UI — Connect Stripe Keys to Activate"**: `STRIPE_SECRET_KEY` is not set in this deployment; set it and redeploy.

## License and credits

See `LICENSE.txt` and `Credits.txt`. You bring your own OpenAI, Stripe and database accounts; this product is not affiliated with them.
