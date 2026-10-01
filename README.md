# Joova

The public site and the staff portals run as a Next.js app. Supabase holds the data and the private keys. Netlify hosts the site.

## Local setup

Copy the example files and replace every mock value:

```bash
cp .env.example .env.local
cp config/supabase.local.properties.example config/supabase.local.properties
```

`.env.local` is the public site client. Keep `VITE_APP_ENV` as `LOCAL` on your machine.

`config/supabase.local.properties` is only for local admin work: migrations, the service role key, the database URL, and the Supabase access token. The Next.js site does not need that file to serve pages.

Do not commit `.env.local` or `config/supabase.local.properties`. Both are gitignored.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy on Netlify

Connect this repository in Netlify and use the Next.js runtime. Build command:

```bash
npm run build
```

Do not publish the `out` folder. This app is not a static export.

Add these environment variables for every deploy context. Use the same names as `.env.local`. Copy the URL and anon key from the Supabase project settings (Project Settings → API).

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the anon public key |
| `VITE_APP_ENV` | `PROD` or `production` on the live site |

`VITE_APP_ENV` is shown on every internal portal header. `PROD` and `production` are hidden, in any capitalization. Any other value, such as `LOCAL` or `STAGING`, is shown.

Do not put the service role key, database URL, or access token in Netlify. Those stay in `config/supabase.local.properties` on a trusted machine.

`NEXT_PUBLIC_*` names are not required. The app reads the `VITE_` names above.

Redeploy after changing any `VITE_` variable. Next.js includes those values at build time.

## Secrets that must live in Supabase

These keys stay in the Supabase project. They are not Netlify environment variables.

Supabase injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into Edge Functions. You do not create those two yourself.

### Vault

In the Supabase dashboard, open Vault and store these secret names exactly:

| Secret name | What it is |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_` or `rk_`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the local Next.js webhook route |
| `RESEND_API_KEY` | Resend API key for Joova email |
| `SUPER_ADMIN_EMAIL` | Super Admin email address |

The database functions `read_stripe_key`, `read_stripe_webhook_secret`, `read_resend_key`, and `read_super_admin_email` read those names. Only the service role can call them. The Vault webhook secret is for local `stripe listen` against `/api/stripe/webhook`. The deployed site does not use that route.

### Edge Function secrets

In Supabase, open Edge Functions → Secrets and set the same values the functions read from their own environment:

| Secret name | Used by |
| --- | --- |
| `RESEND_API_KEY` | `joova-internal`, `send-password-reset`, `stripe-webhook` |
| `STRIPE_SECRET_KEY` | `joova-internal`, `stripe-webhook`, `start-checkout` |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` |
| `SUPER_ADMIN_EMAIL` | `joova-internal` |

`STRIPE_WEBHOOK_SECRET` in Edge Function secrets is the signing secret for the Stripe endpoint below. It can differ from the Vault value used by the local Next.js route.

Do not add the service role key to Netlify or to the Next.js app. Pay now calls the `start-checkout` Edge Function with the anon key. That function reads the Stripe secret and writes the order with the service role Supabase injects into the function. The properties-file service role key is only for local setup scripts and `stripe listen` against `/api/stripe/webhook`.

Point the Stripe webhook at `https://ivieoxndmgzpqnvroafk.supabase.co/functions/v1/stripe-webhook`.

Subscribe that endpoint to `checkout.session.completed` and `checkout.session.expired`. After creating it, copy its `whsec_` value into the `STRIPE_WEBHOOK_SECRET` edge secret. The function reads that secret on each request.
