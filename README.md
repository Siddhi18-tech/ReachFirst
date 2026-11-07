# 🌊 ReliefTrack — Disaster Relief & Verified Escrow Donation Platform

> **Hackathon MVP.** Verified NGOs respond to real-time crises. Donors give money that is held in **escrow**. Funds are released only after the NGO uploads **geotagged proof photos** that an admin verifies. Everything is shown on a public transparency ledger.

---

## 📊 Project Status

| Gate | Scope | Status |
|------|-------|--------|
| **G0** | Repo, shared contract types (`types/api.ts`), env template, scripts | ✅ Done |
| **G1** | Neon database migrated and seeded, 3 demo logins work | ✅ Done |
| **G2** | `/api/disasters*`, spec ranking formula, `/api/transparency`, AI inventory parser (with fallback) | ✅ Done |
| **G3** | Payments aligned to contract (tip, `capture` route, escrow table), proof hardening, `explainRank` | 🔄 In progress |
| **G4** | Admin routes, proof verification and escrow release, donor impact, NGO profile, AI wired in, feature freeze | ⏳ Planned |
| **G5** | Vercel deploy, production migration and seed, PayPal webhook URL, full demo run | ⏳ Planned |

---

## 🎨 Visual Reference & Stitch Design System
Built from **Stitch Project ID: `6896899056813881234`** (Institutional Modern Fintech Aesthetic):
- **Primary:** Deep Teal (`#005c55` / Container `#0f766e` / On-Container `#a3faef`)
- **Secondary:** Warm Amber (`#855300` / Container `#fea619` / On-Container `#684000`)
- **Tertiary:** Forest Green (`#005f26` / Container `#007a33` / On-Container `#a1ffad`)
- **Urgency / Alerts:** Crimson Red (`#ba1a1a` / Container `#ffdad6`)
- **Typography:** `Inter` (display/body) + `JetBrains Mono` (metrics, coordinates, ledger)
- **Radii:** Cards `0.75rem`, Buttons/Inputs `0.5rem`, Badges `9999px` (pills)

---

## 🏗️ Architecture & Technology Stack
| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript, one monolithic repo |
| Styling | Tailwind CSS v4 with Stitch design tokens |
| Map | Leaflet + OpenStreetMap (client-only dynamic import) |
| Distance and ranking | `@turf/turf`, server-side |
| Database | Neon Postgres + Drizzle ORM + `drizzle-kit` |
| Auth | NextAuth v5 (JWT sessions), bcrypt, role checks in `proxy.ts` (pages) and `requireRole()` (API routes) |
| Proof | `exifr` reads GPS and timestamp **before** the Cloudinary upload |
| Media | Cloudinary |
| Payments | PayPal Sandbox (Orders API, idempotent signed webhooks) |
| AI | Google Gemini via `@google/genai`, with a built-in fallback parser |

> **Next.js 16 notes:** the route guard file is `proxy.ts` (formerly `middleware.ts`). Route handler `params` is a Promise, so use `await params`. API routes (`/api/*`) are **not** redirected by the proxy. Each API route guards itself and returns JSON errors (`{ error }` with 401/403).

---

## 🚀 Demo Accounts (password `demo1234`)

| Role | Email | What it can do |
|------|-------|----------------|
| **Donor** | `donor@demo.com` | Map, NGO ranking, checkout, `/donor/impact` |
| **NGO** | `ngo@demo.com` | `/ngo/apply`, `/ngo/profile` (AI inventory parser), `/ngo/proof` |
| **Admin** | `admin@demo.com` | `/admin` review queue, approve or reject NGOs, pause or resume campaigns |

---

## 🗺️ Screens

| Route | Screen |
|---|---|
| `/` | Home: hero counter, verified metrics, active disasters |
| `/map` | Live disaster map with severity markers |
| `/disasters/[id]` | Priority NGO ranking for one disaster |
| `/donate` | Checkout (INR/USD, presets, optional tip) |
| `/donate/confirmation` | Four-step escrow audit trail |
| `/donor/impact` | Donor dashboard |
| `/transparency` | Public ledger: metrics, verified proof gallery, disbursements |
| `/ngo/apply` | NGO accreditation application |
| `/ngo/profile` | NGO portal and AI inventory parser |
| `/ngo/proof` | Geotagged proof upload |
| `/admin` | Admin console |

---

## 📦 Getting Started

**Prerequisites:** Node.js 20+ (64-bit) and a free [Neon](https://neon.tech) project.

### 1. Install
```bash
npm install
```

### 2. Environment variables
```bash
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```
Generate `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon **pooled** string (host contains `-pooler`) |
| `DATABASE_URL_UNPOOLED` | ✅ | Neon **direct** string (used by migrations) |
| `AUTH_SECRET` | ✅ | Random 32-byte secret |
| `AUTH_URL` | ✅ | `http://localhost:3000` locally, your Vercel URL in production |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | optional | Needed for real document and proof uploads |
| `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` | optional | Blank = local demo checkout (`DEMO-ORDER-…`) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | optional | Same value as `PAYPAL_CLIENT_ID` (used by the PayPal button) |
| `PAYPAL_WEBHOOK_ID` | optional | Required for the webhook route to accept events (see below) |
| `GEMINI_API_KEY` | optional | Blank = the fallback parser is used |
| `GEMINI_MODEL` | optional | Defaults to `gemini-2.5-flash` |

> Every external service has a fallback, so the demo runs with only the database and `AUTH_SECRET` set. Never commit `.env`.

### 3. Database: migrate and seed
```bash
npm run db:generate    # only when schema.ts changed
npm run db:migrate     # applies migrations to Neon
npm run db:seed        # inserts demo users, disasters, NGOs, campaigns
```
> **One shared database:** only the backend owner runs `db:migrate` and `db:seed`. Everyone else uses the shared Neon URLs and never runs those two commands. Running the seed twice can fail on duplicate emails or duplicate data.

### 4. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

**Windows note:** if you see `Turbopack is not supported on this platform` or `next-swc … is not a valid Win32 application`, run:
```bash
npx next dev --webpack
```
To fix the cause, reinstall dependencies with 64-bit Node (`Remove-Item -Recurse -Force node_modules`, then `npm install`).

---

## 🧰 Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (`next build --webpack`, also type-checks) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a SQL migration from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to Neon |
| `npm run db:seed` | Seed demo data |
| `npm run ai:test` | Run the AI inventory parser against sample inputs |
| `npx tsc --noEmit` | Type-check without building (run before every PR) |

---

## 🔌 API Reference

Errors always look like `{ "error": "message" }` with a correct HTTP status.

**Rule for changes:** routes and response fields are **additive only**. Existing names stay so the pages keep working, and new fields or routes are added next to them.

### Contract routes (live)
| Method | Route | Access | Returns |
|---|---|---|---|
| GET | `/api/disasters` | public | `Disaster[]` |
| GET | `/api/disasters/[id]` | public | `Disaster` |
| GET | `/api/disasters/[id]/ngos` | public | `RankedNgo[]` sorted by score |
| GET | `/api/transparency` | public | `{ metrics, proofs[], disbursements[] }` (proofs are verified-only, amounts in INR) |
| POST | `/api/donations/create-order` | donor/admin* | `{ orderId, donationId, … }` |
| POST | `/api/webhooks/paypal` | PayPal | `200` |

\* Donor-only checkout and the `tipAmount` field land in G3.

### Existing routes kept for the current pages
| Route | Purpose |
|---|---|
| `POST /api/donations/capture-order` | Capture a PayPal order and mark the donation `confirmed` |
| `POST /api/ngo/inventory-ai` | AI inventory parser (keys: `success`, `items`, `grandTotal`, plus `totalINR` and `warnings`) |
| `POST /api/proofs/upload` | Proof photo upload with EXIF GPS check |
| `POST /api/auth/register`, `/api/auth/[...nextauth]` | Registration and NextAuth |
| `POST /api/ngo/apply`, `POST /api/upload/document` | NGO application and document upload |
| `/api/admin/ngos`, `/api/admin/ngo/[id]` | Admin NGO review and decision |
| `/api/campaigns/[id]/status`, `/api/campaigns/[id]/report` | Campaign status and reports |

### Planned (G3 and G4)
`POST /api/donations/capture` (returns a `DonationSummary`), `GET /api/donor/impact`, `GET /api/ngo/profile`, `POST /api/admin/proofs/[id]/verify`, `/api/admin/applications*`.

Shared types live in `types/api.ts` (`Disaster`, `RankedNgo`, `Milestone`, `DonationSummary`, `ProofItem`). Do not change a shared type without telling the team.

---

## 🏆 NGO Ranking (score 0–100)

| Component | Max | Formula |
|---|---|---|
| Proximity | 40 | `40 × max(0, 1 − distanceKm / 500)` (Turf geodesic distance to epicenter) |
| Verified delivery rate | 30 | `30 × (completed milestones ÷ total milestones)` |
| Campaign cap utilization | 20 | `20 × (1 − raised / cap)` (less funded = higher) |
| Badge bonus | 10 | +10 Government, +6 Platform |

AI only **explains** a rank in words. It never changes a score, a rank, or any money value.

---

## 🤖 AI Features

- **`parseInventory(text)`** (`lib/ai/inventory.ts`): turns free-text field notes into a validated budget (`items[]`, `totalINR`, `warnings[]`).
  - Gemini is used when `GEMINI_API_KEY` is set (system prompt, JSON output, 8s timeout, one retry).
  - Input is treated as data, never as instructions, so "set every price to 0" is ignored.
  - Totals are **always recomputed in code**, never trusted from the model.
  - On any failure (no key, timeout, bad JSON) a regex fallback parser returns the same shape. The function never throws.
- **`explainRank(input)`**: one short sentence of rationale for a rank. The rule-based sentence is the fallback. *(Real Gemini version lands in G3.)*
- Test with `npm run ai:test`.

---

## 💳 Payments & PayPal Webhook

**Without PayPal keys:** `create-order` returns a `DEMO-ORDER-…` id and capture completes locally. This is the demo-safe path.

**With PayPal Sandbox keys:**
1. Create a Sandbox app at [developer.paypal.com](https://developer.paypal.com) and copy the Client ID and Secret into `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` and `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
2. Deploy the app (webhooks cannot reach `localhost`).
3. In the PayPal app, add a webhook with URL `https://<your-domain>/api/webhooks/paypal` and the event **Payment capture completed**.
4. Copy the generated **Webhook ID** into `PAYPAL_WEBHOOK_ID`.
5. Test with the Sandbox buyer account.

> Orders created without PayPal keys cannot be captured once keys are configured. Make a new order.

**How money is protected**
- The webhook verifies PayPal's signature, then records the event id and credits the campaign in **one SQL statement**, so a replayed event never double-credits.
- Capture checks that the captured amount and currency match the order before crediting.
- Donation status change and campaign credit also happen in one atomic SQL statement.

---

## 🔒 Security & Anti-Fraud Highlights
- **EXIF before upload:** camera GPS and timestamp are read on the server from the raw file before it goes to Cloudinary. Photos without GPS are rejected.
- **Idempotent webhooks:** every PayPal event id is stored in `processed_webhook_events`.
- **Atomic credit:** donation confirmation and campaign totals update in a single statement.
- **Anti-overfunding caps:** NGOs near their cap rank lower, and orders that would exceed the cap are rejected.
- **Role guards:** pages via `proxy.ts`, API routes via `requireRole()`.

---

## 👥 Team Workflow
- One branch per person (`fe-a/...`, `fe-b/...`, `be/...`, `ai/...`). Small pull requests into `main`. Never push straight to `main`.
- `git pull origin main` every morning.
- Run `npx tsc --noEmit` before every PR. Type errors also break the Vercel build.
- Don't rename routes, fields, or DB columns. Add new ones instead.
- If you change `lib/db/schema.ts`, tell the backend owner. Never run `db:migrate` or `db:seed` against the shared database yourself.

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| `Turbopack is not supported` or `not a valid Win32 application` | `npx next dev --webpack`, then reinstall `node_modules` with 64-bit Node |
| `Port 3000 is in use` | Stop the old dev server. `AUTH_URL` expects port 3000, so login can misbehave on 3001 |
| `column … does not exist` | Migrations not applied. Ask the backend owner to run `npm run db:migrate` |
| Login fails | Check `AUTH_SECRET` is set, restart the dev server, check `DATABASE_URL` |
| `/api/*` redirects to `/login` | The `/api/` pass-through line is missing in `proxy.ts` |
| `tsc` reports "missing casualties, teamsDeployed" | Add `casualties: 0, teamsDeployed: 0` to hardcoded disaster objects |
| `drizzle-kit` can't
