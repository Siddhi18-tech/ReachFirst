# ReliefTrack

**Every donation goes where help is needed most, and every rupee is backed by proof.**

ReliefTrack is a disaster relief donation platform built for the PayPal Hackathon. Verified NGOs raise funds for disaster relief, and donors are guided to the NGOs that are closest to the worst-affected areas and have the least funding, so money doesn't pile up with a few well-known organizations.

---

## Table of contents

1. [Problem](#problem)
2. [Solution](#solution)
3. [Key features](#key-features)
4. [How NGOs join the platform](#how-ngos-join-the-platform)
5. [How we check a campaign is genuine](#how-we-check-a-campaign-is-genuine)
6. [User roles](#user-roles)
7. [Priority-based funding](#priority-based-funding)
8. [How it works](#how-it-works)
9. [Tech stack](#tech-stack)
10. [System architecture](#system-architecture)
11. [Database tables](#database-tables)
12. [Getting started](#getting-started)
13. [Environment variables](#environment-variables)
14. [PayPal sandbox setup](#paypal-sandbox-setup)
15. [Demo data](#demo-data)
16. [Limitations](#limitations)
17. [Roadmap](#roadmap)
18. [Team](#team)
19. [License](#license)

---

## Problem

- Donors don't know which NGOs to trust or where their money goes.
- Aid piles up in well-known areas and NGOs, while the worst-hit places and small NGOs get very little.
- NGOs have no single place to raise funds and coordinate relief.

## Solution

One platform where verified NGOs raise disaster relief funds through PayPal. Donors are guided to the NGOs that are nearest to the worst-affected areas and have the least funding, and they can see proof of how their money was used.

## Key features

- **Priority-based funding:** donors see a ranked list of NGOs ordered by severity of the area served, distance, and funding gap. Each NGO has a funding cap, so once it is full, donors are moved to the next one.
- **Verified NGOs:** government-verified NGOs are pre-listed, and private NGOs apply with documents and are approved by an admin.
- **Genuine campaigns:** every campaign is tied to a real disaster and approved by an admin before going live.
- **PayPal payments:** PayPal is the only payment method. Payments are confirmed by webhook and recorded in our own ledger.
- **Milestone release:** funds are released in stages, unlocked by receipts and delivery proof.
- **Transparency dashboard:** money received, spent, remaining, and campaign progress.
- **Impact tracking:** photos, receipts, and delivery confirmations, with an EXIF timestamp and location check on uploads.
- **Interactive map:** disaster zones, severity, NGOs, and their needs.
- **AI helper (optional):** turns a pasted, messy inventory list into structured data.

## How NGOs join the platform

1. **Government-verified NGOs:** pre-listed (modelled on NGO Darpan, India's government NGO registry; sample data in the demo).
2. **Private NGOs:** apply with documents (registration certificate, PAN, 12A/80G, FCRA if they take foreign money, bank details). An admin reviews and approves.
3. Every NGO gets a badge: **Govt Verified** or **Platform Verified**.

## How we check a campaign is genuine

1. A campaign must be linked to a real disaster event, with a source link and date.
2. The NGO states the needs (item, quantity, cost) and uploads evidence (photos, news links).
3. An admin approves the campaign before it goes live.
4. Funds are released in milestones: receipts and delivery proof unlock the next release.
5. An admin can pause a campaign at any time.

## User roles

| Role | What they can do |
|---|---|
| **Donor** | Browse campaigns, see the priority list, donate via PayPal, track impact |
| **NGO** | Register, manage profile, create campaigns, upload proof and expenses |
| **Admin** | Approve NGOs and campaigns, create disasters and severity zones, review proof, pause campaigns |

## Priority-based funding

When a donor chooses a disaster, they see a ranked list of verified NGOs instead of a random list.

```
priority score = 0.40 x severity of the area the NGO serves
               + 0.30 x nearness (closer = higher)
               + 0.30 x funding gap (raised vs goal, lower raised = higher)
```

- **Severity:** set by an admin for each affected zone (scale of 1 to 5).
- **Nearness:** distance from the NGO's relief base to the worst-affected area.
- **Funding gap:** NGOs with the least funds raised compared to their goal rank higher.
- **Funding cap:** once an NGO's cap is full, it drops down and the next NGO moves up.
- **Score breakdown:** shown on screen for every NGO so the ranking is explainable.

This works for any disaster and any region. A donor abroad doesn't need to know local geography to give where it matters most.

## How it works

**1. NGO onboarding**
Private NGO applies and uploads documents, an admin approves, and the NGO gets a badge.

**2. Campaign creation**
The NGO creates a campaign with needs, base location, and evidence. An admin approves it and it appears on the map.

**3. Priority list**
The donor picks a disaster. The backend scores each approved campaign and returns the ranked list.

**4. Donation (PayPal only)**
1. The donor clicks Donate and the backend creates a PayPal order.
2. The donor approves the payment in PayPal, in their own currency.
3. The backend captures the order.
4. A PayPal webhook confirms the payment. The signature is verified and the donation is written to the ledger. The PayPal order ID is used as an idempotency key so retries don't double-count.
5. The dashboard and the NGO's funds raised update.

**5. Milestone release and proof**
The NGO uploads receipts and delivery photos. EXIF checks run automatically. An admin reviews the proof and releases the next milestone. The donor sees the update on the transparency dashboard.

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | Next.js, Tailwind CSS |
| Map | Leaflet + OpenStreetMap (no API key needed) |
| Distance | Turf.js |
| Backend | Next.js API routes |
| Database, auth, storage | Supabase (Postgres, Auth, Storage) |
| Payments | PayPal Sandbox (Orders API, JS buttons, Webhooks) |
| AI (optional) | Gemini API (free key) |
| Proof check | exifr |
| Hosting | Vercel |
| Webhook testing | ngrok (or deploy early on Vercel) |

## System architecture

```
 DONOR            NGO              ADMIN
 (browser)      (browser)        (browser)
    |               |                |
    +---------------+----------------+
                    |
        FRONTEND: Next.js + Leaflet map (Vercel)
        - donor: map, priority list, donate, impact view
        - NGO: profile, campaigns, proof upload
        - admin: approvals, review, pause campaigns
                    |
                    v
        BACKEND: Next.js API routes
        +----------------------------------------------+
        | Auth + roles   | Campaign service            |
        | NGO onboarding | Priority ranking engine     |
        | Donation/ledger| Proof + EXIF checker        |
        | Milestone logic| PayPal webhook handler      |
        +----------------------------------------------+
              |            |              |
              v            v              v
          SUPABASE       PAYPAL        GEMINI API
          - Postgres     - Orders      (optional)
          - Auth         - Webhooks    - inventory parsing
          - Storage                    - ranking explanation
```

## Database tables

```
users       (id, role: donor / ngo / admin)
ngos        (id, user_id, name, badge, lat, lng, docs, status)
disasters   (id, type, name, center_lat, center_lng, radius_km,
             severity, source_link)
campaigns   (id, ngo_id, disaster_id, goal, cap, status)
needs       (id, campaign_id, item, quantity, unit_cost)
donations   (id, donor_id, campaign_id, amount, currency,
             paypal_order_id, status)
milestones  (id, campaign_id, amount, status)
proofs      (id, campaign_id, file_url, exif_time, exif_gps, verified)
expenses    (id, campaign_id, amount, receipt_url)
```

## Getting started

### Prerequisites

- Node.js 18 or later
- A free [Supabase](https://supabase.com) project
- A [PayPal Developer](https://developer.paypal.com) account (sandbox)
- (Optional) A free Gemini API key from Google AI Studio
- (Optional) ngrok, for testing webhooks locally

### Install and run

```bash
git clone https://github.com/<your-username>/reliefTrack.git
cd reliefTrack
npm install
cp .env.example .env.local
# fill in your keys (see below)
npm run dev
```

Open http://localhost:3000.

## Environment variables

Create a `.env.local` file in the project root:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PayPal (sandbox)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com

# Gemini (optional)
GEMINI_API_KEY=
```

> Never commit `.env.local` or any real secrets. Keep `SUPABASE_SERVICE_ROLE_KEY` and `PAYPAL_CLIENT_SECRET` server-side only.

## PayPal sandbox setup

1. Log in to the PayPal Developer Dashboard and create a sandbox app.
2. Copy the **Client ID** and **Secret** into `.env.local`.
3. Use the sandbox **buyer** account to make test donations.
4. Add a webhook pointing to `https://<your-domain-or-ngrok-url>/api/paypal/webhook` and subscribe to `PAYMENT.CAPTURE.COMPLETED`.
5. Copy the **Webhook ID** into `.env.local`.

A donation is marked as paid only after the verified webhook arrives, never based on the front end alone.

## Demo data

For the demo, the database is seeded with:

- 2 disasters with severity zones
- 8 to 10 NGOs (a mix of Govt Verified and Platform Verified)
- A few approved campaigns with different funding levels, so the priority list shows clear differences
- Sample proofs, receipts, and expenses for the transparency dashboard

Demo accounts (replace with your own):

| Role | Email | Password |
|---|---|---|
| Donor | donor@example.com | `<set-your-own>` |
| NGO | ngo@example.com | `<set-your-own>` |
| Admin | admin@example.com | `<set-your-own>` |

## Limitations

This is a hackathon prototype.

- **Seeded data:** disasters, NGOs, and severity zones are seeded or admin-entered. There are no field workers yet, so area severity is not confirmed on the ground.
- **PayPal sandbox:** payments run in the sandbox, and milestone releases are simulated in the ledger. In production, holding and releasing donor funds needs PayPal approval and legal compliance.
- **Legal:** foreign donations to Indian NGOs are subject to FCRA rules. Holding donor money can trigger money-handling, KYC, and tax-receipt requirements (for example 80G/12A in India).
- **Verification:** NGO and campaign checks are manual and don't scale. Photos and receipts can be forged, so EXIF checks help but are not foolproof.
- **Distance:** straight-line distance ignores blocked or flooded roads.
- **Ranking bias:** boosting low-funded NGOs could favor weaker ones, so verification badges and track record are shown too.
- **PayPal fees:** fees and currency conversion reduce small donations.

## Roadmap

- Field worker reports by text, photo, and voice note
- Multilingual voice transcription (Hindi, Bengali, Odia, and more)
- Live disaster feeds (GDACS, ReliefWeb) to verify events automatically
- Road-aware routing instead of straight-line distance
- Real PayPal payouts for milestone release
- Offline-friendly mobile app for low-connectivity areas
- Email and push notifications for donors and NGOs
- Recurring and corporate donations

## Team

| Name | Role |
|---|---|
| `<name>` | `<role>` |
| `<name>` | `<role>` |
| `<name>` | `<role>` |

## License

MIT
