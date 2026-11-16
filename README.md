# FraudFenceAI

Fraud prevention and AML platform for lean risk teams. Next.js 15 (App Router), TypeScript, Tailwind, Supabase (Auth, Postgres, RLS), Gemini for AI case investigation, Selar for payments.

Reference research and design notes: [docs/REFERENCE_AUDIT.md](docs/REFERENCE_AUDIT.md).

## What it does
- **Transaction screening**: deterministic 0-100 score with listed signals, approve/review/decline. Dashboard form, CSV import (200 rows), REST API (`POST /api/v1/screen`, Growth+).
- **Rules engine**: org-defined rules (field, operator, value, points, action).
- **Customers**: automatic risk tier from jurisdiction, PEP, sanctions hit, behaviour.
- **Watchlists**: import your own sanctions/PEP name lists and email/device/IP blocklists. Fuzzy name matching. No government list is bundled.
- **Cases**: auto-opened for review/decline, status workflow, notes.
- **AI investigator** (Gemini): structured, validated summary built only from case evidence. It never computes scores.
- **Connections graph**: customers sharing devices, emails or IPs.
- **Billing**: Starter $47, Growth $57, Scale $97 per month, with usage limits and a 14-day trial.

## Setup
1. `npm install`
2. Create a Supabase project. In the SQL editor run [supabase/schema.sql](supabase/schema.sql).
3. In Supabase, Authentication > URL Configuration: set Site URL to your domain and add `<domain>/auth/callback` to Redirect URLs (also `http://localhost:3000/auth/callback` for local work).
4. Copy `.env.example` to `.env.local` and fill it in.
5. `npm run dev`

Scripts: `npm run dev | build | start | typecheck | test`.

## Environment variables
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Webhook, admin page, API-key endpoint |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL, auth email redirects |
| `ADMIN_EMAILS` | Comma list allowed to open `/admin` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | AI investigator |
| `NEXT_PUBLIC_SELAR_STARTER_URL` / `_GROWTH_URL` / `_SCALE_URL` | Checkout links (defaults are the supplied Selar links) |
| `SELAR_WEBHOOK_SECRET` | Shared secret for `/api/webhooks/selar` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional contact shown on About |

## Payments: how plans activate
Returning from checkout never activates a plan. Activation happens only by:
1. **Webhook** `POST /api/webhooks/selar?token=<SELAR_WEBHOOK_SECRET>` (or header `x-webhook-secret`). It matches the buyer email to an account and maps the amount ($47/$57/$97) to a plan, granting 30 days. Unmatched payments are stored for review.
2. **Admin page** `/admin` (emails in `ADMIN_EMAILS`) for manual activation after you verify a payment in Selar.

**Needs your verification:** the webhook reads buyer email and amount from the payload using best-effort field names, and Selar's real payload and signing options were not available to test. Send a Selar test event and adjust `pick(...)` keys in `src/app/api/webhooks/selar/route.ts` if needed. Until then use the admin page. Also confirm the plans are monthly subscriptions in Selar; the app assumes 30-day periods and does not auto-renew without a new payment event.

## Deploy to Vercel
1. Import the GitHub repo in Vercel (framework: Next.js, defaults).
2. Add every variable above in Project Settings > Environment Variables.
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL, update Supabase redirect URLs, redeploy.
4. In Selar, point the payment webhook at `https://<domain>/api/webhooks/selar?token=<secret>`.

## Security notes
- RLS on every table; members only see their organization's rows. `payments` has no policies (service role only).
- Plan columns are protected by a database trigger: signed-in users cannot edit their own plan.
- Service role key is only imported in server-only modules.
- API keys are stored as SHA-256 hashes and shown once.
- Inputs validated with zod on the server.

## Limits and honest notes
- Risk-country lists in `src/lib/risk/constants.ts` are defaults to review, not legal advice.
- Velocity and history are computed from your own screened data.
- AI features need `GEMINI_API_KEY`; without it the investigate button returns a clear error.
