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
| `OPENAI_API_KEY` | For AI Writer | OpenAI key (`sk-...`) | platform.openai.com → API keys |
| `STRIPE_SECRET_KEY` | For billing | Stripe secret key (`sk_...`) | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | For billing | Webhook signing secret (`whsec_...`) | Stripe Dashboard → Webhooks (or `stripe listen` locally) |
| `STRIPE_PRICE_STARTER` | For billing | Price ID of the Starter plan (`price_...`) | Stripe Dashboard → Product catalog |
| `STRIPE_PRICE_PRO` | For billing | Price ID of the Pro plan (`price_...`) | Same place |

Accepted aliases, useful when a host already defines them: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (for `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`), `NEXTAUTH_SECRET` (for `AUTH_SECRET`). Set either name, not both.

## Feature → required keys

| Feature | Needs |
|---|---|
| Pages `/`, `/pricing`, `/login`, `/register` | `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` |
| Dev login (local only) | the three above, `npm run dev` |
| Google login | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| AI Writer (`/writer`, history, `/api/ai/generate`) | login, `DATABASE_URL`, `OPENAI_API_KEY` |
| Billing (`/billing`, checkout) | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO` |
| Subscription sync (webhook) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

Without `OPENAI_API_KEY` the AI Writer returns HTTP 503 with the message "OPENAI_API_KEY is not configured". Without Stripe keys, checkout in development redirects to the dashboard with a mock success; in production it shows "Billing is not configured".

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

1. Create two recurring prices in Stripe (Starter and Pro) and put their IDs in `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_PRO`.
2. Put your secret key in `STRIPE_SECRET_KEY`. Use test keys (`sk_test_...`) until you are ready to go live.
3. Webhook endpoint: `https://YOUR-DOMAIN/api/webhooks/stripe`. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`.
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
- **AI Writer returns 503**: `OPENAI_API_KEY` is missing.

## License and credits

See `LICENSE.txt` and `Credits.txt`. You bring your own OpenAI, Stripe and database accounts; this product is not affiliated with them.
