# 🌊 ReliefTrack — Disaster Relief & Verified Escrow Donation Platform

> **Institutional Modern Fintech for Disaster Relief.** Verified NGOs respond to real-time crises. Donors give money that is held in **cryptographic & audited escrow**. Funds are released only after the NGO uploads **EXIF-geotagged proof photos** that platform administrators verify. Everything is transparently immutably tracked on a public ledger.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4_Stitch-005c55?logo=tailwindcss)](https://tailwindcss.com/)
[![Neon Database](https://img.shields.io/badge/Neon-Serverless_Postgres-00e599?logo=postgresql)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.4-C5F74F?logo=drizzle)](https://orm.drizzle.team/)
[![NextAuth v5](https://img.shields.io/badge/NextAuth-v5_Beta-purple?logo=auth0)](https://authjs.dev/)
[![PayPal Sandbox](https://img.shields.io/badge/PayPal-Smart_Checkout-003087?logo=paypal)](https://developer.paypal.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_2.5_Flash-4285F4?logo=google)](https://ai.google.dev/)

---

## 📊 Project Gates & Implementation Status

| Gate / Phase | Scope | Status |
|---|---|---|
| **G0** | Monorepo setup, shared contract types (`types/api.ts`), environment template, scripts | ✅ Complete |
| **G1** | Neon Postgres schema migrations and seed data, NextAuth credential auth | ✅ Complete |
| **G2** | `/api/disasters*`, continuous Turf.js ranking formula, public `/api/transparency`, AI inventory parser | ✅ Complete |
| **G3** | Escrow payments (tip support, `capture` route, audit trail), server-side EXIF proof verification, AI `explainRank` | ✅ Complete |
| **G4** | Admin review queue, proof verification & milestone release, donor impact API, NGO profile API | ✅ Complete |
| **FE-Phase 1** | Stitch design tokens (Tailwind v4), Inter & JetBrains Mono fonts, shared component library (`/dev/ui`) | ✅ Complete |
| **FE-Phase 2** | Auth UI (`/login`, `/register`), 1-click demo accounts, role-based redirects, `NotAuthorized` screen | ✅ Complete |
| **FE-Phase 3** | Home hero count-up & ledger, Live Leaflet Map (`/map`) with custom severity markers & filters, Disaster NGO ranking (`/disasters/[id]`) with 0–100 score rings & AI rationale | ✅ Complete |
| **FE-Phase 4–6**| Checkout & confirmation, NGO portal & proof upload, Donor impact & public ledger dashboards | 🔄 Next Phase |

---

## 🎨 Visual Reference & Stitch Design System
Built from **Stitch Project ID: `6896899056813881234`** (Institutional Modern Fintech Aesthetic):
- **Primary (Deep Teal):** `#005c55` · Container `#0f766e` · On-Container `#a3faef` · Hover `#00453f`
- **Secondary (Warm Amber):** `#855300` · Container `#fea619` · On-Container `#684000`
- **Tertiary (Forest Green):** `#005f26` · Container `#007a33` · On-Container `#a1ffad`
- **Urgent / Error (Crimson Red):** `#ba1a1a` · Container `#ffdad6` · On-Container `#93000a`
- **Typography:** `Inter` (display/body) + `JetBrains Mono` (metrics, coordinates, ledger amounts)
- **Border Radii:** Cards `0.75rem` (`rounded-card`), Buttons/Inputs `0.5rem` (`rounded-input`), Badges `9999px` (`rounded-pill`)

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) + TypeScript | Full-stack server components, route handlers, and SSR |
| **Styling** | Tailwind CSS v4 + Stitch Tokens | Modern CSS `@theme` variables, institutional design |
| **Geospatial Map** | Leaflet + OpenStreetMap | Client-side safe dynamic import, custom `L.divIcon` severity markers |
| **Distance & Scoring**| `@turf/turf` | Server-side geodesic calculations from crisis epicenter |
| **Database** | Neon Serverless Postgres + Drizzle ORM | Scalable pooled connections with typed schemas |
| **Authentication** | NextAuth v5 (Auth.js) | JWT session tokens, role-based route proxy (`proxy.ts`), normalized credentials |
| **Proof Auditing** | `exifr` + Cloudinary | Server-side EXIF GPS extraction **before** Cloudinary upload; data-URI fallback |
| **Payments & Escrow**| PayPal Sandbox (Orders & Captures API) | Idempotent webhooks, tip support, local demo checkout fallback |
| **Generative AI** | Google Gemini (`@google/genai`) | Budget parsing & rank explanations with deterministic regex fallback |

---

## 🚀 Demo Accounts (Hackathon One-Click Login)

The `/login` screen includes **1-click quick login buttons** that auto-fill credentials and sign in immediately:

| Persona | Email | Password | Default Redirect | Purpose |
|---|---|---|---|---|
| **Donor** | `donor@demo.com` | `demo1234` | `/map` | Browse crises, inspect NGO rankings, fund escrow, view impact |
| **NGO** | `ngo@demo.com` | `demo1234` | `/ngo/profile` | View accreditation status, parse AI budgets, upload geotagged proof |
| **Admin** | `admin@demo.com` | `demo1234` | `/admin` | Review NGO applications, verify proof photos, release milestone funds |

---

## 🗺️ Application Routes

### Frontend Screens
| Route | Screen Name | Description |
|---|---|---|
| `/` | **Home** | Hero section with animated count-up, verified metric ledger (`font-mono`), active disaster cards, 4-step workflow strip |
| `/map` | **Live Disaster Map** | Interactive Leaflet map with custom Level 2/3/4 markers, casualty/team counters, and disaster type & severity filters |
| `/disasters/[id]` | **NGO Rankings** | Priority NGO cards with 0–100 score rings, distance in km, cap progress bar, and expandable AI "Why this rank" breakdown |
| `/donate` | **Escrow Checkout** | Smart donation checkout (INR/USD), presets, 5% optional tip, supply breakdown, PayPal Buttons |
| `/donate/confirmation` | **Escrow Audit Trail** | 4-step interactive milestone audit stepper |
| `/donor/impact` | **Donor Dashboard** | Personal donation history, active campaign progress, and geotagged field photos |
| `/transparency` | **Public Ledger** | High-level metrics, verified proof photo gallery, and disbursement ledger |
| `/ngo/apply` | **NGO Accreditation** | Multi-step accreditation application with document uploads |
| `/ngo/profile` | **NGO Portal** | Accreditation badge, campaign progress, and AI Inventory Budget Parser card |
| `/ngo/proof` | **Proof Upload** | Field delivery photo upload with client and server-side EXIF GPS verification |
| `/admin` | **Admin Console** | Review queue for NGO applications and unverified field delivery proof photos |
| `/login` | **Sign In** | Credentials login with 1-click hackathon judge demo buttons |
| `/register` | **Registration** | Account creation with Donor or NGO role selector |
| `/not-authorized` | **Access Restricted** | Friendly security banner with role clearance indicator and account switch |
| `/dev/ui` | **Component Showcase** | Interactive test harness displaying all shared Stitch UI components |

---

## 🔌 API Contract Reference

All API routes return JSON and guard against unauthorized roles using `requireRole()` and NextAuth sessions. Errors follow the format `{ "error": "message" }`.

### Public Endpoints
- `GET /api/disasters`: Returns active disasters sorted by severity.
- `GET /api/disasters/[id]`: Returns single disaster record.
- `GET /api/disasters/[id]/ngos`: Returns `RankedNgo[]` prioritized by algorithmic score with AI explanation.
- `GET /api/transparency`: Returns aggregate metrics, verified proof gallery items, and escrow disbursements.

### Donor Endpoints (Requires `donor` or `admin`)
- `POST /api/donations/create-order`: Initializes a PayPal order or demo order. Supports `tipAmount` and 2-decimal validation.
- `POST /api/donations/capture`: Captures order and returns a 4-step `DonationSummary` audit trail.
- `GET /api/donor/impact`: Returns personal donation breakdown, campaigns funded, and delivery proofs.

### NGO Endpoints (Requires `ngo` or `admin`)
- `GET /api/ngo/profile`: Returns NGO details, campaigns, milestones, and uploaded proof records.
- `POST /api/ngo/inventory-ai`: Parses unformatted relief notes into structured items (`name`, `quantity`, `unitCostINR`, `totalINR`, `warnings`).
- `POST /api/ngo/apply`: Submits NGO accreditation application with legal documents.
- `POST /api/proofs/upload`: Uploads field delivery photo with mandatory EXIF GPS check.

### Admin Endpoints (Requires `admin`)
- `GET /api/admin/ngos?status=pending`: Lists NGO accreditation applications.
- `POST /api/admin/ngo/[id]`: Approves or rejects NGO application with optional reason.
- `GET /api/admin/proofs`: Unverified proof review queue.
- `POST /api/admin/proofs/[id]/verify`: Verifies delivery proof and automatically disburses the next pending milestone funds.

### Webhooks & System
- `POST /api/webhooks/paypal`: Idempotent PayPal webhook handler verifying capture signatures.

---

## 🏆 Algorithmic NGO Ranking Formula (Score 0–100)

ReliefTrack uses deterministic mathematics to rank relief organizations. **AI only explains the score in words—it never alters rank or financial values.**

$$\text{Total Score} = \text{Proximity (40)} + \text{Delivery Rate (30)} + \text{Cap Utilization (20)} + \text{Badge Bonus (10)}$$

| Component | Max Points | Formula / Rule | Institutional Rationale |
|---|---|---|---|
| **Proximity** | 40 | $40 \times \max\left(0, 1 - \frac{\text{distanceKm}}{500}\right)$ | NGOs physically closer to the epicenter deploy aid faster. |
| **Verified Delivery Rate** | 30 | $30 \times \left(\frac{\text{completedMilestones}}{\text{totalMilestones}}\right)$ | Prioritizes organizations with audited proof delivery records. |
| **Cap Utilization** | 20 | $20 \times \left(1 - \frac{\text{raised}}{\text{cap}}\right)$ | Prevents overfunding; directs capital to underfunded relief operations. |
| **Badge Bonus** | 10 | $+10$ Govt Accredited, $+6$ Platform Verified | Rewards state-vetted humanitarian agencies. |

---

## 🤖 AI Features (Gemini 2.5 Flash)

- **AI Field Inventory Budget Parser (`parseInventory`)**:
  - Turns raw field notes (e.g., *"500 packets baby food at 80 rs, 200 tarpaulins @ 450"*) into clean, category-classified budget items.
  - **Prompt Injection Defense**: Input is enclosed in `<inventory>` XML tags and treated strictly as data.
  - **Zero Trust Mathematics**: Totals are **always recomputed in code** (`quantity * unitCost`), never trusted from model output.
  - **Graceful Fallback**: If `GEMINI_API_KEY` is omitted or timed out, a built-in deterministic regex parser produces the identical JSON schema.
- **AI Rationale Explainer (`explainRank`)**:
  - Summarizes the quantitative score breakdown into a concise 40-word narrative for donors.
  - Number validation ensures the model never invents or alters metrics.
  - Cached in-memory with TTL.

---

## 📦 Getting Started

### Prerequisites
- **Node.js 20+** (64-bit recommended)
- A free [Neon Postgres](https://neon.tech) database (or any PostgreSQL instance)

### 1. Installation
```bash
git clone https://github.com/your-org/relieftrack.git
cd relieftrack
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Generate your `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Fill in `.env`:
```env
# Neon Postgres
DATABASE_URL=postgresql://user:password@ep-xyz-pooler.neon.tech/relieftrack?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@ep-xyz.neon.tech/relieftrack?sslmode=require

# Auth.js / NextAuth v5
AUTH_SECRET=your_generated_32_byte_secret
AUTH_URL=http://localhost:3000

# Optional: Cloudinary (graceful fallback data-URI if blank)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional: PayPal Sandbox (local demo checkout if blank)
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=
PAYPAL_WEBHOOK_ID=
NEXT_PUBLIC_PAYPAL_CLIENT_ID=

# Optional: Google Gemini (deterministic parser fallback if blank)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

# Optional: Force client mock data toggle
NEXT_PUBLIC_USE_MOCK=false
```

> **Demo Safe:** ReliefTrack runs completely with only `DATABASE_URL` and `AUTH_SECRET` populated. All external APIs (Cloudinary, PayPal, Gemini) have built-in local fallbacks.

### 3. Database Migration & Seed
```bash
npm run db:migrate     # Applies Drizzle migrations to Neon
npm run db:seed        # Seeds demo users, active disasters, accredited NGOs, and campaigns
```

### 4. Run Development Server
```bash
npm run dev
```

*Windows PowerShell note (if Turbopack is unsupported):*
```bash
npx next dev --webpack
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧰 Available Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Starts local Next.js development server |
| `npm run build` | Compiles production build (`next build --webpack`, includes type check) |
| `npm run start` | Runs the production build server |
| `npm run lint` | Runs ESLint validation across the codebase |
| `npx tsc --noEmit` | Strict TypeScript compiler check without emitting files |
| `npm run db:generate` | Generates SQL migrations from Drizzle schema (`lib/db/schema.ts`) |
| `npm run db:migrate` | Executes SQL migrations against target database |
| `npm run db:seed` | Seeds database with demo personas, crises, and NGOs |
| `npm run ai:test` | Executes standalone validation test on the AI Inventory Parser |

---

## 🔒 Security & Anti-Fraud Architecture

1. **Pre-Upload EXIF Verification**: Server extracts camera GPS coordinates and timestamps directly from the raw binary before uploading to Cloudinary. Proof uploads lacking geolocation are rejected.
2. **Atomic Ledger Updates**: Milestone status changes, campaign raised amounts, and donation confirmations happen inside single atomic SQL statements to prevent race conditions.
3. **Idempotent Webhook Processing**: PayPal capture webhook IDs are checked against `processed_webhook_events` to ensure replayed events never double-credit funds.
4. **Anti-Overfunding Caps**: Campaigns nearing their funding cap are down-weighted by the ranking formula, and transactions exceeding the cap are rejected.
5. **Route Clearance**: Edge middleware (`proxy.ts`) protects pages with role redirects, and API endpoints validate roles using `requireRole()`.

---

## 📄 License
This project was built for hackathon evaluation under the MIT License.
