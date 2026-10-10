# PLAN.md — Northeast AgriChain
### Detailed Multi-Page Website Plan (Build Blueprint)

> Derived from `Project.md`. This is the **implementation plan** for the site: sitemap, every page spec, auth, AI wiring (GPT-4o mini), API surface, data model, phasing, and acceptance criteria.

**Locked decisions**
| Decision | Choice |
|---|---|
| Frontend | Next.js 14+ App Router, TypeScript, Tailwind CSS, PWA |
| Backend | Python **FastAPI** + SQLAlchemy, PostgreSQL **PostGIS**, Redis |
| AI model | **OpenAI `gpt-4o-mini`** (vision + text) for *all* AI features |
| Auth | Phone + OTP login, refresh-token sessions, role-based access control (RBAC) |
| i18n | en, as (Assamese), bn (Bengali), hi (Hindi), kha (Khasi), mzo (Mizo) |
| Maps | MapLibre GL + OpenStreetMap tiles; GraphHopper/OSRM for terrain routing |

---

## 1. Product Goals & Constraints

**Goals**
1. Hyper-local climate intelligence + disaster early warning for 8 NER states.
2. AI crop disease/pest diagnosis from a photo, tuned to NER specialty crops.
3. Connect fragmented rural clusters to cold storage, logistics, and buyers.
4. FinTech layer: alternative credit score, escrow-backed trade, weather-index insurance.

**Hard constraints this plan is written against**
- **Low-bandwidth, hill-terrain users** → mobile-first, ≤180 KB initial JS, image compression before upload, offline-first PWA with queued sync.
- **Low literacy** → voice/TTS advisory, icon + color-first UI, large tap targets (≥48 px).
- **One AI model** → `gpt-4o-mini` does diagnosis, advisory narration, price/risk explanation, chat, and translation assistance. Deterministic code (not the model) computes all numbers (scores, ETA, shelf-life) so figures are never hallucinated.
- **Demo-able end-to-end** → every module reachable within 3 clicks after login.

**Out of scope for v1 (note in demo):** real satellite NDVI pipeline (use seeded/synthetic indices), production escrow rails (simulate smart contract state machine), native mobile apps (responsive web only), WhatsApp bot.

---

## 2. Sitemap / Information Architecture

```
Public
├── /                         Home (marketing + value prop + NER crop strip)
├── /features                 Module tour (4 modules)
├── /crops                    NER Crop Registry (public browse)
├── /pricing-tracker          Public price ticker teaser → CTA
├── /login                    Login (phone → OTP)
├── /signup                   Registration (role + state/district + language)
├── /verify                   OTP verification screen
└── /forgot                   Account recovery (phone re-OTP)

App (auth required)
├── /dashboard                Role-aware command center (redirects by role)
├── /weather                  Module 1 — forecasts + crop calendar
├── /alerts                   Module 1 — disaster early warning feed
├── /diagnose                 Module 2 — AI plant disease diagnostic (camera/upload)
├── /diagnose/[id]            Diagnosis result detail + remedy history
├── /soil                     Module 2 — soil health & nutrient advisory
├── /yield                    Module 2 — yield forecast
├── /map                      Module 3 — storage discovery + terrain routes map
├── /map/facility/[id]        Storage facility detail + booking request
├── /shipments                Module 3 — shipment list + live tracking
├── /shipments/new            Module 3 — pooled (shared vehicle) booking flow
├── /marketplace              Module 4 — B2B produce listings
├── /marketplace/new          Module 4 — create listing (FPO/Farmer)
├── /marketplace/[id]         Listing detail + grade/trace-to-farm + buy
├── /prices                   Module 4 — dynamic pricing engine
├── /credit                   Module 4 — farmer risk & credit score
├── /insurance                Module 4 — weather-index claim + loss estimate
├── /assistant                GPT-4o mini agri chat assistant (voice-enabled)
├── /admin                    Government / extension officer dashboard
├── /settings                 Profile, language, voice, notifications, offline data
└── /help                     Onboarding guide + FAQ + support WhatsApp
```

**Navigation model**
- **Public:** sticky top nav → Features, Crops, Prices, Log in, Sign up.
- **App (mobile):** bottom tab bar — Home, Weather, Diagnose (center, raised), Map, Market. Secondary items in a slide-in drawer.
- **App (desktop):** persistent left sidebar grouped as *Climate · Crops · Supply Chain · Trade & Finance · System*.
- **Role visibility:** nav items filter by RBAC role; unauthorized routes return a friendly 403 screen (never a crash).

---

## 3. Authentication & Authorization

### 3.1 Flow
1. `/login` → enter **phone** (10-digit, +91) → `POST /api/v1/auth/otp/request`.
2. `/verify` → 6-digit OTP (dev: shown on screen / logged; prod: SMS + WhatsApp). OTP TTL 5 min, max 5 attempts, 60 s resend cooldown, stored hashed.
3. On success → `POST /api/v1/auth/otp/verify` returns `{access_token, refresh_token, user}`. Access JWT 15 min, refresh token 30 d (httpOnly cookie, rotating).
4. `middleware.ts` guards `/dashboard`, `/weather`, … `/admin`. Unauthenticated → `/login?next=<path>`.
5. **Signup** captures: name, phone, **role**, state, district, block, preferred language, and role-specific fields (FPO name/registration no.; Buyer company; Transporter fleet size).
6. **Session persistence:** 30-day "keep me signed in"; silent refresh on focus; graceful re-login prompt when offline queue flushes.

### 3.2 Roles & default landing
| Role | Default route | Can access |
|---|---|---|
| `farmer` | `/dashboard` | weather, alerts, diagnose, soil, yield, map, shipments/new, marketplace(+new), prices, credit, insurance, assistant |
| `fpo` | `/dashboard` | farmer set + bulk listings, pooled shipments, FPO analytics |
| `buyer` | `/marketplace` | marketplace, prices, shipments (track), facilities (view), assistant |
| `transporter` | `/shipments` | map, shipments (all statuses), facilities, marketplace (view), assistant |
| `admin` (gov/extension) | `/admin` | everything + admin analytics, alert publishing, user moderation |

### 3.3 Requirements checklist
- [x] Role-based access control (5 roles) enforced **server-side** on every FastAPI route *and* client-side for nav.
- [x] OTP via SMS/WhatsApp; no passwords for farmers.
- [x] Account lockout + rate limiting (Redis: 10 OTP requests/hour/phone).
- [x] Login page fully offline-tolerant (queues OTP request, shows clear retry state).
- [x] Audit log table for admin actions.
- [x] Language preference stored at login → applied to whole session.

---

## 4. Page-by-Page Specification

> Every page spec lists: purpose → personas → sections/components → data & API → AI usage → states → responsive/a11y.

### P1 · `/` — Home
- **Purpose:** explain the platform in 5 seconds; drive sign-up.
- **Sections:** Hero (headline + "Start with your district" selector + CTA) → 4 module cards → live NER crop ticker (Lakadong turmeric, Bhut Jolokia, Queen pineapple, large cardamom, Joha rice, tea) → impact metrics (spoilage ↓, middlemen cut) → 5 persona testimonials → trust logos (Organic Mission NE, eNAM, IMD) → CTA → footer (language switcher).
- **Components:** `Hero`, `DistrictPicker`, `ModuleCard`, `PriceTicker`, `StatsCounter`, `LangSwitch`.
- **Data:** `GET /api/v1/public/stats`, `GET /api/v1/public/ticker-prices`.
- **States:** skeleton ticker while loading; static fallback if API down.

### P2 · `/login`, `/signup`, `/verify`, `/forgot`
- **Purpose:** fast, phone-first entry; collect role + locale.
- **Sections:** centered card, brand mark, language switch, phone field with +91 prefix, role chips on signup, district cascading selects (state → district → block), OTP 6-box input with paste/auto-advance, "Get OTP on WhatsApp" alternative, dev-mode OTP hint banner.
- **Components:** `PhoneInput`, `RoleChipGroup`, `DistrictCascader`, `OtpInput`, `LangSwitch`, `ResendTimer`.
- **API:** `auth/otp/request`, `auth/otp/verify`, `auth/register`, `auth/refresh`, `auth/logout`.
- **States:** invalid number, OTP expired/wrong, too-many-attempts, network error, already-registered, account pending verification.
- **A11y:** auto-focus, SMS autofill (`autocomplete="one-time-code"`), screen-reader announcements, keyboard-only complete.

### P3 · `/dashboard` — Role-Aware Command Center
- **Purpose:** one glance at what needs action today.
- **Sections:** greeting + district weather chip → **alert banner** if active severe alert → 4 KPI tiles (Weather risk, Diagnoses this week, Active listings, In-transit shipments) → module quick actions → recent activity feed → language/voice toggle.
- **Role variants:** Farmer = advisory + credit score card; FPO = listing performance + pooled shipment queue; Buyer = new listings matching preferences; Transporter = assigned routes + road closures; Admin = state-wide heat tiles + outbreak/pest indicators.
- **API:** `GET /api/v1/dashboard/summary?role=`, `alerts/active`, `marketplace/my-listings`, `shipments/mine`.
- **AI:** `gpt-4o-mini` generates a 3-sentence **"Today's advisory"** from the user's district weather + crop + season (temperature 0.3, cached 6 h per district+crop).
- **States:** zero-data onboarding state, loading skeletons, degraded (API error) → cached last summary.

### P4 · `/weather` — Climate Intelligence (Module 1)
- **Purpose:** 7-day hyper-local forecast + sowing/harvest advisory.
- **Sections:** district/block selector → 7-day strip (rainfall, humidity, wind, solar radiation, min/max temp) → hourly graph → **soil moisture projection** → **crop calendar** (sow/transplant/harvest windows with green/amber/red bands) → **ITK panel** ("Traditional wisdom says…" alongside meteorological data) → TTS "Listen" button on every advisory.
- **Components:** `ForecastStrip`, `HourlyChart`, `CropCalendar`, `ItkCard`, `VoiceButton`, `UnitToggle`.
- **API:** `GET /weather/forecast?lat&lon&days=7` (server: Open-Meteo + IMD feed, cached in Redis 30 min), `GET /weather/crop-calendar?crop&district`, `POST /weather/advisory/tts`.
- **AI:** `gpt-4o-mini` composes plain-language, dialect-friendly advisory text and merges ITK + meteorological sources into one recommendation block (structured JSON: `{summary, sow_window, harvest_window, caution, itk_note}`).
- **States:** no-location, API timeout → last cached forecast with timestamp, alert overlay.

### P5 · `/alerts` — Disaster Early Warning (Module 1)
- **Purpose:** push-style feed of flash flood, landslide, cloudburst, frost warnings.
- **Sections:** severity-sorted alert cards (color: red/orange/yellow) with valid-until countdown → district map preview → "Set my districts" subscription → notification preference (browser push / SMS) → safety checklist per alert type.
- **Components:** `AlertCard`, `SeverityFilter`, `CountdownPill`, `PushOptIn`, `SafetyChecklist`.
- **API:** `GET /alerts?districts=`, `POST /alerts/subscribe`, `POST /alerts/ack/:id`. Admin publishes via `/admin`.
- **AI:** `gpt-4o-mini` expands a structured alert record into a localized, actionable 4-sentence warning + translates to the user's language (never invents coordinates/times — those come from the record).
- **States:** no alerts (calm empty state), push denied, expired alert auto-dimmed.

### P6 · `/diagnose` — AI Plant Disease Diagnostic (Module 2) ⭐
- **Purpose:** photo → instant issue identification + remedy.
- **Sections:** upload area (drag-drop, **camera capture**, gallery) → crop picker (NER specialty registry, pre-filled from farm profile) → optional part-of-plant selector (leaf/fruit/stem) → analyze button → **loading state with staged progress** → result.
- **Result page `/diagnose/[id]`:** issue name (EN + local language), **confidence %**, affected region on the sample image, why-the-model-thinks-this (3 bullets), **organic remedy**, **chemical treatment** (with dosage + safety interval), severity, "monitor again in 3 days" CTA, history list of past diagnoses.
- **Components:** `ImageDropzone`, `CameraCapture`, `CropSelect`, `AnalysisProgress`, `DiagnosisCard`, `RemedyTabs`, `HistoryList`.
- **Client pre-processing:** max 1024 px longest edge, JPEG q0.8, ≤1.5 MB before upload (hill-bandwidth rule).
- **API:** `POST /diagnose` (multipart) → stores image, returns job id; `GET /diagnose/{id}`; `GET /diagnose?farm_id=`.
- **AI (see §5):** `gpt-4o-mini` **vision** call with crop context → strict JSON diagnosis.
- **States:** no image, unsupported format, upload progress bar, analysis failed → retry + "consult extension officer" fallback, low-confidence (<55%) → "need clearer photo" prompt, offline → queue image and notify when processed.

### P7 · `/soil` — Soil & Nutrient Advisory (Module 2)
- **Purpose:** turn soil health card data into regenerative actions for acidic hill soils.
- **Sections:** soil health card upload (image/PDF) or manual entry (pH, N, P, K, organic carbon) → pH/ nutrient gauge chart → recommended practices (composting, bio-fertilizer, lime application) with dosage → seasonal task list → estimated cost + nearby input suppliers.
- **API:** `POST /soil/profile`, `GET /soil/advisory`, `POST /soil/card/ocr`.
- **AI:** `gpt-4o-mini` (a) OCR-ish extraction from soil card image into JSON fields, (b) human-readable regimen text. **Numeric recommendations come from a rules table** (pH bands, NPK deficits), model only narrates.
- **States:** no soil test yet → suggest nearest testing center, partial card data.

### P8 · `/yield` — Yield Forecasting (Module 2)
- **Purpose:** predict harvest output for planning sales/storage.
- **Sections:** farm + crop selector → forecast chart (expected / low / high band) → contributing factors (weather, soil, historical yield, inputs) → "what if" sliders (rainfall ±, irrigation) → link to *Create listing* when within 30 days of harvest.
- **API:** `GET /yield/forecast?farm_id&crop&season`.
- **AI:** model is **lightweight gradient-boosted regression (server-side)**; `gpt-4o-mini` only writes the plain-language explanation of the band and confidence. Formula + inputs shown for trust.
- **States:** <2 seasons of history → "estimate based on district average" badge.

### P9 · `/map` — Storage & Terrain Logistics (Module 3) ⭐
- **Purpose:** find nearby cold storage / godowns and safe routes.
- **Sections:** full-screen NER map with layers (cold storage, godowns, warehouses, road closures, landslide warnings, flood zones) → left filter drawer (distance, capacity available, temperature-controlled, crop type) → facility cards sorted by distance → click → facility detail panel.
- **`/map/facility/[id]`:** photos, capacity/available tons, temperature setpoints, price, owner, **availability chart**, "Request booking" CTA, route preview from farm → facility with ETA + elevation profile.
- **Components:** `MapCanvas` (MapLibre), `LayerToggle`, `FacilityCard`, `FacilityPanel`, `RoutePreview`, `ElevationProfile`.
- **API:** `GET /facilities?bbox&filters`, `GET /facilities/{id}`, `GET /routes/plan?origin&dest` (GraphHopper/OSRM + elevation penalties + live closures), `POST /bookings`.
- **AI:** `gpt-4o-mini` summarizes route risk in 2 lines ("Route via NH-37 risky: landslide warning till 18:00, prefer NH-2 diversion, +47 min"). **ETA/distance computed by routing engine, not the model.**
- **States:** map tiles offline (cached district outlines + facility list fallback), no facilities in radius, loading cluster markers.

### P10 · `/shipments` + `/shipments/new` (Module 3)
- **Purpose:** track consignments and pool smallholder loads into shared vehicles.
- **List:** table/cards — shipment id, crop, origin→destination, transporters, status timeline (Booked → Picked → In transit → Delivered), ETA, **shelf-life countdown**, route health badge.
- **`/shipments/new` wizard (4 steps):** 1) select listings/produce → 2) origin + destination + preferred date → 3) **pooling suggestions** ("3 other farmers on this route → freight splits 42%") → 4) confirm booking + escrow hold.
- **Detail:** live map polyline, stop events, ambient temperature/humidity log (cold-chain), proof-of-delivery, issue report (spoilage) button.
- **API:** `GET /shipments`, `GET /shipments/{id}/track`, `POST /shipments/pool/suggest`, `POST /shipments`, `PATCH /shipments/{id}/status`.
- **Shelf-life index:** deterministic formula f(transit duration, ambient temp/humidity profile, crop perishability coefficient) → 0–100 with color.
- **AI:** `gpt-4o-mini` writes ETA/risk narration and damage-report summaries.
- **States:** no shipments, delayed/rerouted, sensor gap, offline tracking (shows last known).

### P11 · `/marketplace` — B2B Produce Listing (Module 4)
- **Purpose:** FPOs/farmers list lots; buyers source verified NER produce.
- **List:** filter rail (crop, state, grade, organic cert, price, quantity, harvest date, "trace-to-farm") + card grid (photo, crop, qty, ₹/kg, grade badge, seller rating, distance).
- **`/marketplace/new`:** multi-step form — photos, crop, variety, quantity, grade, certification upload, harvest date, min price, floor price, delivery terms → preview card → publish.
- **`/marketplace/[id]`:** gallery, quality grade, certification, **trace-to-farm** panel (farm polygon, district, soil/organic history, diagnosis log), price history sparkline, seller profile, *Make offer* / *Buy with escrow* / *Request sample*, chat with seller.
- **API:** `GET /listings?filters`, `POST /listings`, `GET /listings/{id}`, `POST /orders` (escrow hold), `POST /orders/{id}/release`.
- **States:** no results, draft listing, sold out, escrow pending, banned/unverified seller.

### P12 · `/prices` — Dynamic Pricing Engine (Module 4)
- **Purpose:** transparent pricing vs APMC mandis and national eNAM.
- **Sections:** crop selector → current modal price + 30/90-day trend chart → **local mandi vs eNAM vs platform average** comparison bars → shortage/demand heat by district → "best window to sell" indicator → price alert setter.
- **API:** `GET /prices/{crop}?region`, `POST /prices/alerts`.
- **AI:** `gpt-4o-mini` produces a 3-line market commentary and explains the "sell now / hold" indicator; all series are hard data.
- **States:** missing mandi feed → show platform-only data with badge.

### P13 · `/credit` — Alternative Credit & Risk Score (Module 4)
- **Purpose:** micro-loan eligibility signal for FPOs/farmers.
- **Sections:** credit score gauge (300–850) + band → **factor breakdown bars** (vegetation index NDVI/EVI, historical yield stability, climate risk for district, trade repayment record, landholding) → improvement tips → "download shareable risk profile PDF" → lender connect (express interest).
- **API:** `GET /credit/score?user_id`, `GET /credit/factors`.
- **Scoring:** deterministic weighted model server-side; **never** by the LLM.
- **AI:** `gpt-4o-mini` narrates the score in farmer-friendly language + 3 concrete improvement actions; explains to lenders in professional tone.
- **States:** insufficient data → "thin file" with steps to build history; no satellite coverage → district-average fallback badge.

### P14 · `/insurance` — Weather-Index Micro-Insurance (Module 4)
- **Purpose:** rapid claim with objective loss estimate.
- **Sections:** policy/claim list → **File claim wizard**: select season/crop → event (flood/frost/hail) + dates → farm polygon auto → system pulls weather index for that polygon/date → **auto loss estimate table** (area affected, % yield loss, payable amount) → upload photos → submit → status timeline (Submitted → Verified → Settled).
- **API:** `GET /insurance/policies`, `POST /insurance/claims`, `GET /insurance/claims/{id}`, `GET /insurance/estimate?polygon&date&event`.
- **AI:** `gpt-4o-mini` fills claim narrative from structured inputs and explains settlement math to the farmer.
- **States:** index not triggered (clear rejection explanation), partial payout, evidence required.

### P15 · `/admin` — Government / Extension Dashboard
- **Purpose:** regional monitoring & publishing.
- **Sections:** 8-state heat map (pest outbreaks, flood-prone clusters, price anomalies, storage utilisation) → district tables → **publish alert form** → diagnosis surveillance (top diseases this week by district) → user/FPO verification queue → audit log.
- **API:** `GET /admin/analytics`, `POST /admin/alerts`, `PATCH /admin/users/{id}/verify`, `GET /admin/audit`.
- **States:** no admin permission (403), heavy-data pagination.

### P16 · `/assistant` — GPT-4o Mini Agri Assistant
- **Purpose:** single conversational entry to every module; voice-first for low literacy.
- **Sections:** chat canvas with quick-reply chips ("What should I sow this week?", "Is my turmeric price good?", "Find cold storage near Jorhat") → mic button (Web Speech API) → **TTS speak-aloud** of every reply → source/CTA links that deep-link into the right page (e.g., opens `/diagnose`).
- **API:** `POST /assistant/chat` (SSE streaming), `GET /assistant/history`.
- **Guardrails:** system prompt restricts to NER agriculture, always replies in session language, refuses medical/financial advice beyond platform scope, and returns structured `actions` the UI can render as buttons.
- **States:** rate-limited (10 msg/min/user), streaming, model error → FAQ fallback, offline → canned quick-answers.

### P17 · `/settings`, `/help`
- **Settings:** profile, language (6), voice on/off + speed, notification channels (push/SMS/WhatsApp), district subscriptions, offline storage usage, logout-all.
- **Help:** 60-second onboarding, illustrated guides per module, demo credentials, support contact.

---

## 5. AI Integration Plan — `gpt-4o-mini`

### 5.1 Where the model is used
| # | Feature | Modality | Input | Output |
|---|---|---|---|---|
| 1 | **Crop disease diagnosis** | Vision | crop photo (base64), crop name, part, district, season | strict JSON diagnosis |
| 2 | Weather/crop-calendar advisory | Text | forecast JSON + crop + ITK note | JSON advisory block |
| 3 | Alert localization | Text | alert record | localized warning text |
| 4 | Soil card extraction | Vision | soil health card image | JSON nutrient fields |
| 5 | Soil/yield/credit/insurance narration | Text | computed metrics | plain-language explanation |
| 6 | Route & shelf-life commentary | Text | routing/telemetry JSON | 2-line risk summary |
| 7 | Price market commentary | Text | price series | 3-line commentary |
| 8 | Chat assistant (voice) | Text | user msg + conversation | answer + `actions[]` |
| 9 | Translation assist | Text | source text | as/bn/hi/kha/mzo translation |

### 5.2 Call conventions (all calls go through one FastAPI service: `app/ai/`)
```python
MODEL = "gpt-4o-mini"
# Diagnosis (vision)
messages = [
  {"role": "system", "content": DIAGNOSIS_SYSTEM_PROMPT},   # NER crop list, output schema, refusal rules
  {"role": "user", "content": [
      {"type": "text", "text": f"crop={crop}; part={part}; district={district}; season={season}"},
      {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "high"}},
  ]},
]
resp = client.chat.completions.create(
  model=MODEL, messages=messages, temperature=0.2, max_tokens=700,
  response_format={"type": "json_object"},   # or json_schema for strict mode
)
```
- **Diagnosis schema:** `{issue, issue_local, confidence (0-1), severity, organic_remedy, chemical_remedy, dosage, waiting_days, revisit_days, notes}`.
- **Temperature:** 0.2 for diagnosis/extraction; 0.4 for advisory/narration; 0.6 for chat.
- **Structured outputs** (`json_schema`) enforced for every machine-consumed response; validate with Pydantic, retry once on `ValidationError`, then return a safe fallback.
- **Caching:** Redis cache key `ai:{feature}:{hash(inputs)}` — advisory 6 h, price commentary 6 h, diagnosis result persisted (never re-billed).
- **Rate limits:** per-user 20 AI calls/min, 200/day (Redis token bucket); surfaced as friendly UI toast.
- **Cost guardrails:** image resized to ≤1024 px before b64; prompt prefix caching for reused system prompts; daily usage dashboard in `/admin`.
- **Failure mode:** 3 retries with exponential backoff (0.5/1.5/4 s) → circuit breaker after 5 consecutive failures → feature shows "AI busy, showing last known guidance" + human fallback (extension officer contact). **Never block** weather/alerts on AI failure.
- **Safety:** prompts instruct model to say "not confident" rather than guess; confidence < 0.55 triggers "retake photo" UI; no PII (name/phone) sent to the model — only district/crop.

### 5.3 What is deliberately *not* the model
Yield numbers, credit score, shelf-life index, ETA, insurance payout, route distance — all computed by deterministic services. The model only **explains** them. This is required for judging credibility and auditability.

---

## 6. Backend API Surface (FastAPI)

```
/auth          POST otp/request · otp/verify · register · refresh · logout · me
/weather       GET forecast · crop-calendar · soil-moisture · POST advisory/tts
/alerts        GET active · POST subscribe · ack · (admin) create
/diagnose      POST create · GET {id} · GET list · DELETE {id}
/soil          POST profile · GET advisory · POST card/ocr
/yield         GET forecast · POST what-if
/facilities    GET (bbox,filters) · GET {id} · POST (admin) · POST availability
/routes        GET plan · GET elevation · GET closures
/bookings      POST · GET · PATCH status
/shipments     GET · GET {id} · GET {id}/track · POST · POST pool/suggest · PATCH status
/listings      GET · POST · GET {id} · PATCH · DELETE
/orders        POST (escrow hold) · POST {id}/release · GET {id}
/prices        GET {crop} · GET compare · POST alerts
/credit        GET score · GET factors · GET profile-pdf
/insurance     GET policies · POST claims · GET estimate · GET claims/{id}
/assistant     POST chat (SSE) · GET history
/admin         GET analytics · POST alerts · PATCH users · GET audit
/public        GET stats · ticker-prices
```
Conventions: versioned `/api/v1`, cursor pagination, `ETag` on listings, OpenAPI docs at `/docs`, structured error codes, request-id tracing, CORS locked to the web origin.

---

## 7. Data Model (extends `Project.md` §5)

```
Users(id, name, phone, role, state, district, block, language, preferred_channel, is_verified, created_at)
Sessions(id, user_id, refresh_hash, device, expires_at)
Farms(id, user_id, polygon_coords[ geography(Polygon) ], soil_type, elevation, primary_crop, area_ha)
FarmSoilProfiles(id, farm_id, ph, n, p, k, organic_carbon, source, tested_on)
WeatherAlerts(id, district, alert_type, severity, title, body, body_local, valid_from, valid_until, published_by, status)
AlertSubscriptions(id, user_id, district, channel)
CropDiagnoses(id, farm_id, crop, image_url, detected_issue, issue_local, confidence, severity, remedy, chemical, dosage, status, created_at)
SoilAdvisories(id, farm_id, recommendations jsonb, created_at)
YieldForecasts(id, farm_id, crop, season, p50, p10, p90, factors jsonb)
StorageFacilities(id, name, owner_id, location_coords geography(Point), capacity_tons, available_tons,
                  temperature_controlled, min_temp, max_temp, price_per_ton_day, photos jsonb, verified)
FacilityBookings(id, facility_id, user_id, tons, from_date, to_date, status)
ProduceListings(id, fpo_id, crop_name, variety, quantity_kg, price_per_kg, min_price, grade,
                certifications jsonb, harvest_date, farm_id, photos jsonb, status, created_at)
Orders(id, listing_id, buyer_id, qty_kg, amount, escrow_status, created_at, released_at)
Shipments(id, listing_id, transporter_id, origin_coords, dest_coords, route_status, eta, distance_km,
          pooled_with jsonb, shelf_life_index, ambient_log jsonb, status, created_at)
Routes(id, origin, dest, polyline, elevation_profile jsonb, risk_flags jsonb, computed_at)
PricePoints(id, crop, region, source[APMC|eNAM|PLATFORM], price_per_kg, observed_at)
CreditScores(id, user_id, score, band, factors jsonb, ndvi, evi, model_version, computed_at)
InsurancePolicies(id, user_id, crop, season, sum_insured, premium, status)
InsuranceClaims(id, policy_id, event, polygon, date_range, loss_pct, payable, photos jsonb, status)
AssistantMessages(id, user_id, role, content, actions jsonb, tokens_used, created_at)
AiUsageLogs(id, user_id, feature, model, prompt_tokens, completion_tokens, latency_ms, created_at)
AuditLogs(id, actor_id, action, entity, entity_id, meta jsonb, created_at)
```
PostGIS indexes on `location_coords`, `polygon_coords`, GIST; `PricePoints` BRIN on `observed_at`.

---

## 8. Frontend Architecture

```
src/
├── app/
│   ├── (public)/  page.tsx, features, crops, pricing-tracker
│   ├── (auth)/    login, signup, verify, forgot
│   ├── (app)/     dashboard, weather, alerts, diagnose[/[id]], soil, yield,
│   │              map[/facility/[id]], shipments[/new], marketplace[/new]/[id],
│   │              prices, credit, insurance, assistant, admin, settings, help
│   └── api/        (BFF proxy only — tokens stay server-side)
├── components/     ui/  ·  map/  ·  charts/  ·  weather/  ·  diagnose/  ·  market/
├── lib/            api-client.ts · auth.ts · i18n.ts · tts.ts · offline.ts · ai-actions.ts
├── hooks/          useRole, useLocation, useOfflineQueue, useSpeech
├── messages/       en.json as.json bn.json hi.json kha.json mzo.json
└── middleware.ts   (auth guard + locale)
```

**Cross-cutting requirements**
- **i18n:** `next-intl`; every user-facing string keyed; language persists to profile; model outputs localized via feature #9 with UI-side fallback to English.
- **Voice:** Web Speech API — speech-to-text for inputs, **TTS for every advisory, alert, and assistant reply**; speed 0.75/1/1.25×.
- **PWA/offline:** service worker caches shell, last forecast, alert list, and facility list; mutation queue (idempotency keys) flushes on reconnect; "offline" badge with sync time.
- **Low-bandwidth:** route-level code splitting, `next/image` with AVIF/WebP, font subsetting for Assamese/Bengali glyphs, prefetch only on hover, target LCP < 2.5 s on Slow 4G.
- **Design system:** high-contrast (WCAG 2.1 AA), 48 px tap targets, dark mode, semantic color by severity, card-based density, NER green/earth palette, map-first layouts.
- **Accessibility:** full keyboard nav, focus rings, aria-live for async results, alt text on crop photos, labels not placeholders.
- **Responsiveness:** breakpoints 360 / 768 / 1280 / 1600; bottom nav under 768; tables → stacked cards.

---

## 9. Implementation Phases & Acceptance Criteria

| Phase | Days | Deliverables | Done when |
|---|---|---|---|
| **0 · Foundation** | 1–2 | Repo, Next.js + FastAPI + PostGIS + Redis (Docker), CI, design tokens, i18n scaffolding, DB migrations, seed script (8 states, 40 districts, 60 facilities, 120 listings, 12 crops) | `docker compose up` → both apps healthy; seed verified |
| **1 · Auth & Shell** | 2–3 | Login/OTP/signup, RBAC middleware, role dashboards, sidebar/bottom-nav, settings + language | Login with OTP works for all 5 roles; wrong-role route → 403 screen |
| **2 · Climate** | 3–4 | `/weather`, `/alerts`, crop calendar, ITK panel, TTS, push prefs | 7-day forecast for a selected block renders; alert published in `/admin` appears in subscriber feed |
| **3 · AI Diagnosis** | 3–4 | `/diagnose` upload+camera, GPT-4o mini vision pipeline, result page, history, soil & yield pages | Photo of diseased leaf returns valid JSON with ≥1 remedy; low-confidence path shows retake prompt |
| **4 · Supply Chain** | 4 | `/map` layers, facility detail+booking, route planning with terrain/closures, `/shipments` + pooling wizard, shelf-life index | Route from Imphal → Guwahati shows elevation profile + closure detour; pooled booking splits cost |
| **5 · Marketplace & Finance** | 4 | Listing CRUD, detail + trace-to-farm, orders/escrow states, `/prices`, `/credit`, `/insurance` | Create listing → appears in filters → buyer places escrow order → seller marks shipped |
| **6 · Assistant & Polish** | 2–3 | `/assistant` streaming chat + voice, deep-link actions, offline caching, a11y pass, Lighthouse budget, demo script | Assistant opens `/diagnose` from a text question; Lighthouse A11y ≥ 90, Perf ≥ 85 |
| **7 · Buffer & Rehearsal** | 1–2 | Bug bash, load test, 7-minute demo dry run | All P0 acceptance tests green |

---

## 10. Environments & Configuration

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MAP_TILES=https://tiles.example/{z}/{x}/{y}.png
NEXT_PUBLIC_DEFAULT_LANG=en

# Backend (.env)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL=postgresql+psycopg://user:pass@db:5432/agrichain
REDIS_URL=redis://cache:6379/0
JWT_SECRET=...   JWT_REFRESH_SECRET=...
OTP_PROVIDER=mock|msg91|whatsapp
ROUTER_PROVIDER=graphhopper|osrm   GRAPHHOPPER_API_KEY=...
WEATHER_PROVIDER=open-meteo|imd
SMS_PROVIDER_SID=...
CORS_ORIGINS=http://localhost:3000
```
Secrets never ship to the client; `OPENAI_API_KEY` lives only in FastAPI.

---

## 11. Testing & Demo Script

**Testing**
- Unit: score/ shelf-life / yield calculators; Pydantic AI-response validators.
- API: pytest + httpx for every route incl. RBAC denial cases.
- E2E: Playwright — (a) login → forecast, (b) photo → diagnosis → remedy, (c) map → facility → booking, (d) listing → escrow order, (e) claim → estimate.
- AI regression: 12-image golden set of NER crop diseases → assert issue + confidence thresholds; snapshot JSON schema.
- Accessibility: axe-core in CI; performance budget gate in CI.

**7-minute demo script**
1. Login as Farmer (OTP) → dashboard advisory in Assamese (30 s).
2. `/weather` 7-day + crop calendar + "listen" TTS (60 s).
3. Admin publishes landslide alert → farmer receives it (45 s).
4. Upload diseased leaf → GPT-4o mini diagnosis + organic remedy (90 s).
5. `/map` → find cold storage, route with closure detour + ETA (90 s).
6. `/shipments/new` → pool 3 shipments → freight split (75 s).
7. `/marketplace` listing → buyer escrow order → `/prices` + `/credit` score (90 s).
8. `/assistant` voice question deep-links back to diagnosis (45 s).

---

## 12. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| GPT-4o mini misdiagnoses | Trust/judging | Strict JSON + confidence threshold + golden-set regression + "consult officer" fallback |
| Slow/absent hill connectivity | Whole UX | PWA offline cache, mutation queue, image compression, map static fallback |
| Map/routing API key or tiles fail | Module 3 | Self-host OSM tiles for demo bbox; cached facility list view |
| IMD feed unavailable | Module 1 | Open-Meteo primary, IMD secondary, cached 30 min |
| API cost overrun during demo | Budget | Redis caching, rate limits, usage dashboard, prompts ≤ 400 tokens |
| Escrow not truly on-chain | Judging | Honest labeling: "escrow simulation with state machine"; document upgrade path |
| Multilingual model output drift | UX | Validate translated JSON, fall back to English with UI toggle |

---

## 13. Definition of Done (Global)

> Status: the frontend and demo engines are complete and verified (lint + production
> build + route smoke test). The FastAPI backend is scaffolded under `api/` but is
> not yet wired to the UI, so LLM-dependent criteria remain open.

- [x] All 20 routes built, responsive (360 → 1600 px), and reachable per RBAC.
- [x] Login page + OTP verify work end-to-end for all 5 roles.
- [ ] `gpt-4o-mini` wired for the 9 AI features with JSON validation, caching, retries, and fallbacks. _(narration wrapper + `POST /diagnose` scaffolded in `api/`; not yet serving)_
- [x] No numbers (score/ETA/payout/shelf-life) produced by the LLM.
- [x] Offline: shell + last forecast/alerts/facilities usable; writes queue and sync.
- [x] Multilingual (6) + TTS on all advisories, alerts, assistant replies.
- [ ] Lighthouse: Perf ≥ 85, A11y ≥ 90 on mobile profile.
- [ ] Seed data + 7-minute demo script run clean on a fresh clone.
