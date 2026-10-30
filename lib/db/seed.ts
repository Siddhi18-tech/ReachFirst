import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle(sql, { schema });

async function main() {
  console.log("🌱 Seeding ReliefTrack database...");

  // ── 1. Demo users ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const [donor, ngoUser, admin] = await db
    .insert(schema.users)
    .values([
      { email: "donor@demo.com", passwordHash, name: "Raj Sharma", role: "donor" },
      { email: "ngo@demo.com", passwordHash, name: "Priya NGO Admin", role: "ngo" },
      { email: "admin@demo.com", passwordHash, name: "Platform Admin", role: "admin" },
    ])
    .returning();

  // Extra NGO users
  const ngoUsers = await db
    .insert(schema.users)
    .values(
      Array.from({ length: 7 }, (_, i) => ({
        email: `ngo${i + 2}@demo.com`,
        passwordHash,
        name: `NGO User ${i + 2}`,
        role: "ngo" as const,
      }))
    )
    .returning();

  console.log("✅ Users seeded");

  // ── 2. Disasters ───────────────────────────────────────────────────────────
  const [flood, landslide, drought] = await db
    .insert(schema.disasters)
    .values([
      {
        type: "flood",
        name: "Assam Brahmaputra Floods 2024",
        location: "Assam, India",
        centerLat: "26.2006",
        centerLng: "92.9376",
        severity: 4,
        sourceLink: "https://gdacs.org",
        active: true,
      },
      {
        type: "landslide",
        name: "Kerala Western Ghats Landslides",
        location: "Wayanad, Kerala, India",
        centerLat: "11.6854",
        centerLng: "76.1320",
        severity: 3,
        sourceLink: "https://reliefweb.int",
        active: true,
      },
      {
        type: "drought",
        name: "Rajasthan Drought 2024",
        location: "Barmer, Rajasthan, India",
        centerLat: "25.7521",
        centerLng: "71.3967",
        severity: 2,
        sourceLink: "https://imd.gov.in",
        active: true,
      },
    ])
    .returning();

  console.log("✅ Disasters seeded");

  // ── 3. NGOs ────────────────────────────────────────────────────────────────
  const ngoData = [
    // Primary demo NGO (ngoUser)
    {
      userId: ngoUser.id,
      name: "Assam Relief Foundation",
      registrationNumber: "ARF/2018/001",
      description: "Government-verified disaster relief organization operating in Northeast India.",
      badge: "govt" as const,
      baseLat: "26.1445",
      baseLng: "91.7362",
      address: "Guwahati, Assam",
      status: "approved" as const,
    },
    // Extra NGOs
    {
      userId: ngoUsers[0].id,
      name: "Kerala Disaster Response Network",
      registrationNumber: "KDRN/2019/042",
      description: "Rapid response network for Kerala floods and landslides.",
      badge: "govt" as const,
      baseLat: "11.2588",
      baseLng: "75.7804",
      address: "Kozhikode, Kerala",
      status: "approved" as const,
    },
    {
      userId: ngoUsers[1].id,
      name: "Rajasthan Drought Aid Society",
      registrationNumber: "RDAS/2020/007",
      description: "Providing water and food relief in drought-affected Rajasthan districts.",
      badge: "platform" as const,
      baseLat: "26.9124",
      baseLng: "70.9057",
      address: "Jodhpur, Rajasthan",
      status: "approved" as const,
    },
    {
      userId: ngoUsers[2].id,
      name: "Northeast Flood Volunteers",
      registrationNumber: "NFV/2021/015",
      description: "Community-driven flood relief volunteer network in Assam and Meghalaya.",
      badge: "platform" as const,
      baseLat: "26.4499",
      baseLng: "92.7768",
      address: "Nagaon, Assam",
      status: "approved" as const,
    },
    {
      userId: ngoUsers[3].id,
      name: "India Humanitarian Trust",
      registrationNumber: "IHT/2017/003",
      description: "National-level trust providing multi-disaster relief across India.",
      badge: "govt" as const,
      baseLat: "28.6139",
      baseLng: "77.2090",
      address: "New Delhi",
      status: "approved" as const,
    },
    {
      userId: ngoUsers[4].id,
      name: "Wayanad Tribal Relief Committee",
      registrationNumber: "WTRC/2022/008",
      description: "Focused on protecting indigenous tribal communities during landslides.",
      badge: "platform" as const,
      baseLat: "11.6090",
      baseLng: "76.0834",
      address: "Mananthavady, Wayanad",
      status: "approved" as const,
    },
    {
      userId: ngoUsers[5].id,
      name: "Desert Storm Aid Organisation",
      registrationNumber: "DSAO/2020/011",
      description: "Drought relief, water sourcing and food distribution in western Rajasthan.",
      badge: "platform" as const,
      baseLat: "25.7521",
      baseLng: "71.3967",
      address: "Barmer, Rajasthan",
      status: "approved" as const,
    },
    {
      userId: ngoUsers[6].id,
      name: "Brahmaputra Basin Authority NGO",
      registrationNumber: "BBA/2016/002",
      description: "Government-backed NGO managing flood relief along the Brahmaputra river basin.",
      badge: "govt" as const,
      baseLat: "27.0844",
      baseLng: "93.6053",
      address: "Dibrugarh, Assam",
      status: "pending" as const,
    },
  ];

  const insertedNgos = await db.insert(schema.ngos).values(ngoData).returning();
  console.log("✅ NGOs seeded");

  // ── 4. Campaigns ────────────────────────────────────────────────────────────
  const campaigns = await db
    .insert(schema.campaigns)
    .values([
      // Assam Flood campaigns
      {
        ngoId: insertedNgos[0].id,
        disasterId: flood.id,
        title: "Emergency Food & Shelter — Assam Floods",
        description: "Providing emergency food packets, tarpaulins and temporary shelters to 5,000 flood-displaced families in Morigaon district.",
        goal: "1500000",
        cap: "2000000",
        raised: "487500",
        status: "active" as const,
      },
      {
        ngoId: insertedNgos[3].id,
        disasterId: flood.id,
        title: "Flood Rescue Boats & Medical Aid",
        description: "Deploying rescue boats and mobile medical units to cut-off villages in Nagaon district.",
        goal: "800000",
        cap: "1000000",
        raised: "64000",
        status: "active" as const,
      },
      {
        ngoId: insertedNgos[7 > insertedNgos.length - 1 ? 4 : 4].id,
        disasterId: flood.id,
        title: "National Coordination — Assam Flood Response",
        description: "Coordinating national-level logistics, supply chain, and volunteer deployment.",
        goal: "3000000",
        cap: "5000000",
        raised: "2850000",
        status: "active" as const,
      },
      // Kerala Landslide campaigns
      {
        ngoId: insertedNgos[1].id,
        disasterId: landslide.id,
        title: "Landslide Rescue & Debris Clearance",
        description: "Emergency rescue operations and heavy equipment for debris clearance in Wayanad.",
        goal: "2000000",
        cap: "2500000",
        raised: "1960000",
        status: "active" as const,
      },
      {
        ngoId: insertedNgos[5].id,
        disasterId: landslide.id,
        title: "Tribal Village Rehabilitation — Wayanad",
        description: "Rebuilding homes and livelihoods for 300 tribal families affected by landslides.",
        goal: "1200000",
        cap: "1500000",
        raised: "120000",
        status: "active" as const,
      },
      // Rajasthan Drought campaigns
      {
        ngoId: insertedNgos[2].id,
        disasterId: drought.id,
        title: "Water Tanker Distribution — Barmer",
        description: "Daily water tanker supply to 50 villages in drought-stricken Barmer district.",
        goal: "600000",
        cap: "800000",
        raised: "570000",
        status: "active" as const,
      },
      {
        ngoId: insertedNgos[6].id,
        disasterId: drought.id,
        title: "Emergency Food Kits — Rajasthan Drought",
        description: "Monthly food kits for 2,000 families across 20 drought-affected villages.",
        goal: "400000",
        cap: "500000",
        raised: "44000",
        status: "active" as const,
      },
    ])
    .returning();

  console.log("✅ Campaigns seeded");

  // ── 5. Needs ────────────────────────────────────────────────────────────────
  await db.insert(schema.needs).values([
    { campaignId: campaigns[0].id, item: "Emergency Food Packets (10kg)", quantity: 5000, unitCost: "150" },
    { campaignId: campaigns[0].id, item: "Tarpaulins (4m x 6m)", quantity: 1000, unitCost: "350" },
    { campaignId: campaigns[0].id, item: "Drinking Water (20L Cans)", quantity: 10000, unitCost: "80" },
    { campaignId: campaigns[3].id, item: "Rescue Boats (Motor)", quantity: 20, unitCost: "45000" },
    { campaignId: campaigns[3].id, item: "Mobile Medical Unit Setup", quantity: 3, unitCost: "150000" },
    { campaignId: campaigns[5].id, item: "Water Tanker (10,000L)", quantity: 5, unitCost: "80000" },
    { campaignId: campaigns[5].id, item: "Fuel for Tankers (litres)", quantity: 5000, unitCost: "95" },
  ]);

  // ── 6. Milestones ────────────────────────────────────────────────────────────
  await db.insert(schema.milestones).values([
    { campaignId: campaigns[0].id, title: "Phase 1: Food distribution to 1,000 families", amount: "300000", status: "approved" },
    { campaignId: campaigns[0].id, title: "Phase 2: Shelter kits for 500 families", amount: "600000", status: "pending" },
    { campaignId: campaigns[3].id, title: "Rescue operations: 10 boats deployed", amount: "500000", status: "approved" },
  ]);

  // ── 7. Sample donation ────────────────────────────────────────────────────────
  await db.insert(schema.donations).values([
    {
      donorId: donor.id,
      campaignId: campaigns[0].id,
      amount: "5000",
      currency: "INR",
      paypalOrderId: "PAYPAL-DEMO-001",
      status: "confirmed",
      confirmedAt: new Date(),
    },
    {
      donorId: donor.id,
      campaignId: campaigns[3].id,
      amount: "2500",
      currency: "INR",
      paypalOrderId: "PAYPAL-DEMO-002",
      status: "confirmed",
      confirmedAt: new Date(),
    },
  ]);

  console.log("✅ Needs, milestones, and donations seeded");
  console.log(`
🎉 Seed complete! Demo accounts:
   donor@demo.com  / demo1234  (Donor)
   ngo@demo.com    / demo1234  (NGO - Assam Relief Foundation)
   admin@demo.com  / demo1234  (Admin)
  `);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
