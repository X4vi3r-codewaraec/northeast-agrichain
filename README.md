# Northeast AgriChain

**Agriculture, Climate & Supply-Chain Intelligence Platform** for the North
Eastern Region (NER) of India — Assam, Meghalaya, Arunachal Pradesh, Nagaland,
Manipur, Mizoram, Tripura, Sikkim.

Docs: [`Project.md`](./Project.md) (requirements) · [`PLAN.md`](./PLAN.md) (build plan)

## Stack

**Next.js 16** (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Turbopack
· **Vercel Postgres (Neon)** + Next.js Route Handlers for auth
(a standalone FastAPI + PostGIS scaffold remains in `api/` for reference; see `PLAN.md`)

## Run it

```bash
npm install
npm.cmd run dev      # → http://localhost:3000 (Next prints the port it picks)
npm.cmd run build    # production build + type check
npm.cmd run start    # serve the production build
npm.cmd run lint     # ESLint
```

> **Windows note:** PowerShell script execution is disabled on this machine, so
> use `npm.cmd` instead of `npm` when running commands from the shell.

Demo login: any 10-digit phone → **any 6-digit OTP** → signed in. Without
`POSTGRES_URL`, the login screen offers a "Continue in demo mode" fallback so the
offline demo keeps working.

### Local development with the database

```bash
copy .env.example .env.local   # fill POSTGRES_URL + AUTH_SECRET
npm.cmd run db:migrate         # create tables (idempotent)
npm.cmd run db:seed            # optional: one demo account per role
```

Seeded numbers map to specific roles (e.g. `9876543210` → farmer,
`9876500004` → admin); any other number proceeds to full sign-up.

## Deploy to Vercel (auth + Postgres + gpt-4o-mini)

Auth runs as **Next.js Route Handlers** (`src/app/api/v1/...`) against **Vercel
Postgres** (Neon) — no separate Python service is needed to deploy.

1. Push the repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. **Create the database:** project → **Storage → Create → Postgres**. Vercel
   injects `POSTGRES_URL` into the project automatically.
3. **Set env vars** (Settings → Environment Variables):
   - `AUTH_SECRET` — a long random string (`openssl rand -base64 32`)
   - `OPENAI_API_KEY` — for `gpt-4o-mini`
   - `OPENAI_MODEL` — optional, defaults to `gpt-4o-mini`
4. **Create the tables + demo accounts** (once, locally, against the Vercel DB):

   ```bash
   vercel env pull .env.local
   npm.cmd run db:migrate
   npm.cmd run db:seed
   ```

5. Deploy — every push goes live automatically.

### Auth at a glance

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/auth/otp/request` | Validates the number (no SMS in the hackathon build) |
| `POST /api/v1/auth/otp/verify` | **Accepts any 6-digit code**; signs in, or creates the account when a profile is supplied |
| `POST /api/v1/auth/refresh` | Rotates the session from the refresh cookie |
| `POST /api/v1/auth/logout` | Revokes the session and clears cookies |
| `GET /api/v1/auth/me` | Current user (or `null`) |
| `GET /api/v1/health` | DB / auth / AI configuration status |

Sessions are httpOnly cookies (`nac_at` access, `nac_rt` refresh); `src/proxy.ts`
guards app routes and gates `/admin` by role. When `AUTH_SECRET` is unset the
proxy fails open, so the offline demo still works without a database.

### `gpt-4o-mini` endpoints

Both routes are auth-gated and **fail soft**: the client falls back to its own
rule engine / on-device engine on any error (offline, unauthenticated, AI
disabled, model error).

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/assistant/chat` | Grounded assistant — deterministic engines compute the facts, the model only narrates them |
| `POST /api/v1/diagnose/analyze` | Vision crop diagnosis — the model reads the photo and picks the issue from the crop's catalog; every number (confidence, severity, dosage, waiting/revisit days) is computed in code |

## Routes (so far)

| Route | Page |
|---|---|
| `/` | Landing page (hero, district picker, price ticker, modules, crops, personas, voice band, CTA) |
| `/features` | Four-module platform tour |
| `/crops` | NER specialty crop registry |
| `/pricing-tracker` | Public price snapshot |
| `/weather` | 7-day district climate outlook (live Open-Meteo + offline mock), crop calendar, ITK, voice advisory |
| `/alerts` | Early-warning board (flood/landslide/frost/pest), severity filters, district subscriptions |
| `/diagnose` | AI crop diagnosis (photo → GPT-4o mini vision diagnosis, remedies, history, offline queue) |
| `/map` | Storage & terrain logistics (facilities, distance/ETA, availability, elevation profile, route risk) |
| `/shipments` | Shipment tracking board (status timeline, shelf-life index, pooling) |
| `/shipments/new` | 4-step booking wizard (produce → route → pooling suggestions → escrow hold) |
| `/prices` | Price intelligence (30-day trends, mandi vs eNAM, sell-or-hold signals, market commentary) |
| `/marketplace` | B2B marketplace (verified lots, grades, organic/GI, trace-to-farm, escrow) |
| `/marketplace/new` | 5-step listing wizard (produce → lot & price → origin → proof → review) |
| `/marketplace/[id]` | Listing detail (trace-to-farm polygon, soil/diagnosis history, escrow order rail, seller chat) |
| `/shipments/[id]` | Shipment detail (route polyline, ambient/cold-chain log, milestones, driver, proof-of-delivery) |
| `/map/facility/[id]` | Facility profile (capacity, rates, availability curve, booking) |
| `/diagnose/[id]` | Shareable diagnosis result page |
| `/soil` | Soil & nutrient advisory (pH/NPK/OC gauges, organic vs mineral practices, dosage & cost, soil-card OCR demo) |
| `/yield` | Yield forecast (district-aware bands, weather/practice/terrain factor bars, confidence) |
| `/insurance` | Weather-index insurance (policies, deterministic payout estimator, claim milestones) |
| `/credit` | Credit & weather-index insurance (climate-risk scoring, loan estimates, payout math) |
| `/admin` | Government & extension console (state heat map, disease surveillance, verification queue, audit log) |
| `/dashboard` | Role-aware dashboard (farmer/FPO/buyer/transporter/admin KPIs, advisory with TTS, activity) |
| `/settings` | Language, voice speed and low-bandwidth controls |
| `/help` | Help centre (FAQ, topics, offline tips, support) |
| `/forgot` | Account recovery (phone + any 6-digit OTP) |
| `/assistant` | Voice-first GPT-4o mini agri assistant (quick replies, deep-link actions, TTS) |
| `/login` | Phone + any 6-digit OTP login |
| `/signup` | Role-based account creation |
| `/verify` | Redirects to `/login` |
| `/offline` | PWA offline fallback |
| `/[...slug]` | Catch-all “being built” page for future modules |

## Structure

```
├── src/
│   ├── app/
│   │   ├── (public)/          # marketing + auth pages sharing header/footer
│   │   │   ├── page.tsx       # "/" landing
│   │   │   ├── features/  crops/  pricing-tracker/  login/  signup/  verify/
│   │   │   ├── weather/  alerts/  diagnose/  map/  shipments/
│   │   │   ├── prices/  marketplace/  credit/  assistant/
│   │   │   ├── soil/  yield/  insurance/  admin/  settings/  help/  forgot/
│   │   │   ├── marketplace/new/  marketplace/[id]/
│   │   │   ├── map/facility/[id]/  shipments/[id]/  diagnose/[id]/
│   │   │   └── [...slug]/     # catch-all “module in progress”
│   │   ├── 403/               # access-denied screen
│   ├── api/v1/            # Route Handlers: auth (otp/refresh/logout/me) + health
│   ├── dashboard/         # app shell (post-login, no marketing header)
│   │   ├── offline/           # PWA offline fallback
│   │   ├── manifest.ts        # PWA web app manifest
│   │   ├── layout.tsx         # fonts, metadata, viewport, SW registration
│   │   └── globals.css        # Tailwind v4 theme: forest/gold/sand palette
│   ├── components/
│   │   ├── landing/           # hero, district-picker, sections
│   │   ├── auth/              # login-form, signup-form, forgot-form, dashboard-shell
│   │   ├── layout/            # public-header (client nav), public-footer
│   │   ├── weather/  alerts/  diagnose/  map/  shipments/
│   │   ├── prices/  market/  credit/  assistant/
│   │   ├── soil/  yield/  insurance/  admin/  settings/  help/
│   │   ├── pwa/               # service-worker registration
│   │   ├── public/            # shared CTA band
│   │   ├── ui/                # primitives (Eyebrow, SectionHeading, CheckItem…)
│   │   └── icons.tsx          # inline SVG icon set + logo
│   ├── proxy.ts               # Next 16 middleware: session + role guard
│   └── lib/
│       ├── db.ts              # Postgres pool + query helpers
│       ├── api-client.ts      # fetch wrapper (API error envelope)
│       ├── auth-api.ts        # client calls to /api/v1/auth/*
│       ├── openai.ts          # gpt-4o-mini client (server-only)
│       ├── auth/              # config, jwt, session, users, cookies, crypto, http
│       ├── data.ts            # states, crops, modules, personas, prices (static)
│       ├── geo.ts             # 26 district coords/elevation for routing & weather
│       ├── auth-client.ts     # session mirror + roleHome (localStorage + server sync)
│       ├── i18n.ts            # language store + dictionary (t(), useLanguage)
│       ├── settings.ts        # voice speed, data-saver preferences
│       ├── weather.ts  alerts.ts  logistics.ts  facilities.ts  shipments.ts
│       ├── prices.ts  market.ts  credit.ts  assistant.ts   # module engines (deterministic)
│       ├── soil.ts  yield.ts  insurance.ts  admin.ts  dashboard.ts
│       ├── diagnose.ts        # photo pre-processing + deterministic diagnosis engine
│       ├── diagnose/vision.ts # server-side gpt-4o-mini vision diagnosis
│       └── diagnose-api.ts    # client call to /api/v1/diagnose/analyze
├── public/                    # static assets + sw.js (offline service worker)
├── db/schema.sql              # Postgres schema (users, sessions, audit_logs)
├── scripts/                   # db-migrate.mjs, db-seed.mjs (+ _env.mjs)
├── api/                       # FastAPI backend scaffold (reference alternative)
├── AGENTS.md                  # Next.js 16 version-matched agent rules
├── PLAN.md                    # detailed build plan
├── Project.md                 # original project requirements
└── package.json
```

## Status / next steps

- [x] Design system tokens (Tailwind v4 `@theme`)
- [x] Landing page + public pages + mock OTP login/signup
- [x] Climate module: `/weather` (Open-Meteo + offline mock, crop calendar, ITK, TTS) and `/alerts` (severity board, subscriptions)
- [x] AI diagnosis module: `/diagnose` (image pre-processing ≤1.5 MB, staged GPT-4o mini vision flow, remedies, history, offline queue)
- [x] Logistics module: `/map` (8 NER facilities, terrain ETA, availability, elevation profile, route-risk narration) and `/shipments` (status timeline, shelf-life index, pooling)
- [x] `/shipments/new` 4-step booking wizard (produce → route → deterministic pooling/freight-split suggestions → escrow hold + confirmation)
- [x] Market & fintech module: `/prices` (trends, fair-value bands, sell-or-hold signals), `/marketplace` (verified listings, escrow, trace-to-farm), `/credit` (climate-risk scores, loan readiness, weather-index payouts)
- [x] `/assistant` voice-first chat (intent router mirroring the future `POST /assistant/chat` contract, streaming reveal, deep-link actions, TTS, rate limit)
- [x] Market detail + listing creation: `/marketplace/[id]` (trace-to-farm polygon, soil/diagnosis history, escrow order rail) and `/marketplace/new` (5-step wizard)
- [x] Soil & yield intelligence: `/soil` (pH/NPK/OC gauges, practices, dosage, cost) and `/yield` (district-aware bands, factor contributions, confidence)
- [x] Insurance + admin: `/insurance` (policies, deterministic payout estimator, claim milestones) and `/admin` (state heat map, surveillance, verification queue, audit log)
- [x] Deep-linkable records: `/shipments/[id]`, `/map/facility/[id]`, `/diagnose/[id]` (static params for known ids, on-demand for the rest)
- [x] Role-aware `/dashboard` (farmer/FPO/buyer/transporter/admin), `/settings`, `/help`, `/forgot`
- [x] PWA offline shell: `manifest.ts`, `public/sw.js`, `/offline`, SW registration, theme colour
- [x] i18n scaffold (`lib/i18n.ts` + header language store) and voice-speed preference (`lib/settings.ts`)
- [x] Vercel-ready auth: Next.js Route Handlers + Vercel Postgres (`db/schema.sql`, `scripts/db-migrate.mjs`, `scripts/db-seed.mjs`), JWT httpOnly cookie sessions, `src/proxy.ts` route + role guard, `/403`
- [x] Login / signup / recovery wired to the API — **any 6-digit OTP** (hackathon mode) with a demo-mode fallback when the DB is absent
- [x] `GET /api/v1/health` reporting DB / auth / AI status; `gpt-4o-mini` client ready (`src/lib/openai.ts`)
- [x] `gpt-4o-mini` wired into `/assistant` (grounded narration) and `/diagnose` (vision) behind auth-gated routes, with offline/on-device fallbacks
- [x] Static build passes; lint clean; API routes verified dynamic
- [ ] Wire the remaining module engines (weather, map, shipments, marketplace, finance) to `gpt-4o-mini` + the database
- [ ] Real SMS gateway (hackathon build accepts any 6-digit code), Open-Meteo + mandi/eNAM data adapters