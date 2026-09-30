# LaunchAI Pro — Next.js 15.5 AI SaaS Boilerplate (Envato Clean Build)

**v1.4 dailysmart** · Next.js 15.5.3 · React 18.3.1 · Prisma 5.22.0 · NextAuth 5.0.0-beta.19 · Stripe Ready · Tailwind + shadcn/ui

> Demo: https://launchai-pro.vercel.app | Production Ready (Vercel, dailysmart scope)

## Quick Start

```bash
npm install                 # 447 packages, Prisma Client v5.22.0 generated
cp .env.example .env.local  # never commit .env / .env.local
# fill DATABASE_URL, NEXTAUTH_URL, AUTH_SECRET (openssl rand -base64 32), OPENAI_API_KEY, STRIPE_*
npx prisma generate         # ✔ v5.22.0
npx prisma db push          # or Supabase: paste DATABASE_URL then db push
npm run db:seed             # seeds dev@launchai.pro / dev1234 (dev only)
npx prisma studio
npm run dev                 # http://localhost:3000 — Ready ~2.6s
npm run build && npm start  # ✔ Compiled successfully 16.2s, Linting 0 warnings
```

## Environment

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/launchai` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `OPENAI_API_KEY` | `sk-...` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_PRICE_*` | `sk_test_...` / `whsec_...` / `pk_test_...` / `price_...` |

## Routes (verified Vercel build)

```
○ /              167 B    106 kB   public
○ /_not-found    994 B    104 kB
ƒ /api/ai/generate, /api/team/invite, /api/webhooks/stripe  148 B each
ƒ /billing       167 B    106 kB
ƒ /dashboard     1.04 kB  116 kB
○ /login         5.33 kB  117 kB
○ /pricing       4.08 kB  115 kB
○ /register      167 B    106 kB
ƒ /teams         3.23 kB  114 kB
ƒ /writer        34.9 kB  146 kB   dynamic
Middleware 99 kB — First Load JS 103 kB
```

`/` public 200, `/writer` & `/dashboard` redirect to `/login` when unauthenticated (correct 307).

## Deployment (Vercel)

```bash
vercel --prod --scope dailysmart
# Settings -> Deployment Protection: Vercel Authentication OFF for Production (Envato requires public 200)
# Verify: curl -I https://launchai-pro.vercel.app/pricing | findstr HTTP  -> 200
```

## Structure

```
app/(dashboard)/writer billing dashboard teams — api/ai/generate [id] auth webhooks/stripe
components/ui badge button card input label select textarea progress skeleton — lib/db auth stripe openai
modules/ai-writer — prisma/schema.prisma — public/ — documentation/Documentation.html — LICENSE.txt Credits.txt
```

## Security & Hardening

- `lib/db.ts` `withRetry(fn,{retries:3})` only on `P1001/P1002/P1008`; offline `DATABASE_URL` → empty `GenerationHistory` via `.catch(()=>[])`, prod log `["error"]` only.
- `console.log 0`, `ghp_ 0` verified.
- `.env` / `.env.local` / `.next` / `.vercel` / `node_modules` excluded from zip.

## Support

6 months via Envato. Extended 12 months @ $19.50. Disclaimer: BYOK OpenAI/Stripe/Supabase — not affiliated. See `LICENSE.txt` / `Credits.txt`.
