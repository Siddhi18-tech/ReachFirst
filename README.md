# 🌊 ReliefTrack — Disaster Relief & Verified Escrow Donation Platform

> **Hackathon MVP**: A disaster-relief donation platform connecting verified NGOs responding to real-time crises with donors who demand complete mathematical proof of impact.

---

## 🎨 Visual Reference & Stitch Design System
Built from **Stitch Project ID: `6896899056813881234`** (Institutional Modern Fintech Aesthetic):
- **Primary:** Deep Teal (`#005c55` / Container `#0f766e` / On-Container `#a3faef`)
- **Secondary:** Warm Amber (`#855300` / Container `#fea619` / On-Container `#684000`)
- **Tertiary:** Forest Green (`#005f26` / Container `#007a33` / On-Container `#a1ffad`)
- **Urgency / Alerts:** Crimson Red (`#ba1a1a` / Container `#ffdad6`)
- **Typography:** `Inter` (Display/Body) + `JetBrains Mono` (Metrics, coordinates & financial ledger)
- **Radii:** Cards `0.75rem`, Buttons/Inputs `0.5rem`, Badges `9999px` (Pills)

---

## 🏗️ Architecture & Technology Stack
- **Framework:** Next.js 16 (App Router) + TypeScript in a unified monolithic structure
- **Styling:** Tailwind CSS with custom design tokens from Stitch
- **Interactive Geospatial Map:** Leaflet + OpenStreetMap (client-side dynamic import with OSM attribution)
- **Geodesic Distance & Ranking:** `@turf/turf` running server-side
- **Database & ORM:** Neon Postgres (serverless) + Drizzle ORM & `drizzle-kit`
- **Authentication & Role Guards:** NextAuth v5 (Auth.js) with JWT sessions, password hashing with bcrypt, role-guarded middleware (`/donor/*`, `/ngo/*`, `/admin/*`)
- **Proof & Metadata Inspection:** `exifr` camera EXIF GPS & timestamp extraction *before* Cloudinary upload
- **Media Storage:** Cloudinary SDK for document storage and verified field proof images
- **Payments:** PayPal Sandbox (server-side Orders API, Smart Checkout, and idempotent Webhooks with transactional atomic DB updates)
- **AI Logistics:** Google Gemini API (`@google/genai`) for unstructured relief inventory text parsing to JSON budgets + algorithmic "Why this rank" explanations

---

## 🚀 Live Demo Accounts

| Role | Email | Password | Permissions & Dashboard |
|------|-------|----------|--------------------------|
| **Donor** | `donor@demo.com` | `demo1234` | Live Map, Priority NGO Ranking, PayPal Checkout, My Impact Dashboard (`/donor/impact`) |
| **NGO** | `ngo@demo.com` | `demo1234` | Accreditation Application (`/ngo/apply`), Operations Portal (`/ngo/profile`), Ground Delivery Proof Upload (`/ngo/proof`), AI Inventory Parser |
| **Admin** | `admin@demo.com` | `demo1234` | Accreditation Review Queue (`/admin`), NGO Approve/Reject with Reason, Campaign Pause/Resume |

---

## 🗺️ Key Screens & Route Directory

1. **Home (`/`)**: Hero crisis counter, verified metric ledger, active disaster cards, how-it-works process, and call-to-action.
2. **Live Disaster Map (`/map`)**: Interactive OpenStreetMap visualization with severity markers (Level 4 Critical, Level 3 High, Level 2 Moderate), disaster filters, and live casualty / team metrics.
3. **Priority NGO Ranking (`/disasters/[id]`)**: Algorithmic ranking engine calculating composite scores (0–100) based on:
   - Turf.js proximity to crisis epicenter (max 40 pts)
   - Verified milestone delivery rate (max 30 pts)
   - Campaign cap utilization (max 20 pts)
   - Verification badge bonus (+10 pts Govt / +6 pts Platform)
   - "Why this rank" deterministic & AI rationale
4. **Donation Checkout (`/donate`)**: Currency toggle (INR/USD), presets (₹500 to ₹5,000), real-time supply impact breakdown, optional 5% platform tip, and PayPal Sandbox integration.
5. **Donation Confirmation (`/donate/confirmation`)**: Post-donation 4-step milestone progression audit trail from escrow to beneficiary.
6. **Donor Impact Dashboard (`/donor/impact`)**: Personal audit feed tracking donated funds, campaigns supported, and delivery status.
7. **Public Transparency Dashboard (`/transparency`)**: Open ledger with live metrics, photo proof gallery with camera EXIF GPS coordinates, and escrow disbursement history.
8. **NGO Accreditation Application (`/ngo/apply`)**: Multi-step registration form with document uploads.
9. **NGO Operations Portal (`/ngo/profile`)**: Live badge verification status, submitted documentation links, and AI Inventory Budget Parser.
10. **Ground Delivery Proof Upload (`/ngo/proof`)**: Uploads ground photos, reads EXIF GPS & timestamp before Cloudinary upload, and registers evidence for admin audit.
11. **Admin Console (`/admin`)**: Queue for reviewing NGO accreditations with expandable document inspections, one-click approve/reject with reason logging.

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the credentials:
- `DATABASE_URL`: Neon pooled Postgres connection string
- `DATABASE_URL_UNPOOLED`: Neon direct Postgres connection string (for migrations)
- `AUTH_SECRET`: Random 32-character secret string
- `AUTH_URL`: `http://localhost:3000`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary credentials
- `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID`: PayPal Sandbox credentials
- `GEMINI_API_KEY`: Google Gemini API key

*(Note: The platform features graceful fallback mechanisms for all external APIs so that the hackathon demo runs even without third-party keys).*

### 3. Run Database Migrations & Seed (Optional)
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
npx tsx lib/db/seed.ts
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Hackathon Security & Anti-Fraud Highlights
- **Pre-Cloudinary EXIF Extraction**: Camera metadata (GPS and timestamp) is parsed using `exifr` from the raw file stream on the server *before* passing to Cloudinary, ensuring metadata cannot be stripped or forged.
- **Idempotent Webhooks**: All incoming PayPal events are checked against `processed_webhook_events` to prevent double-crediting.
- **Atomic Transactions**: Donation status updates and campaign raised totals execute in a single database transaction.
- **Anti-Overfunding Caps**: NGOs with high cap utilization are dynamically de-prioritized by the ranking algorithm to distribute relief aid evenly.
