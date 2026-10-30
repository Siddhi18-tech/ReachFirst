import { pgTable, uuid, text, timestamp, numeric, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { FeatureCollection } from "geojson";

// ─── Enums ───────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["donor", "ngo", "admin"]);
export const badgeEnum = pgEnum("badge", ["govt", "platform"]);
export const ngoStatusEnum = pgEnum("ngo_status", ["pending", "approved", "rejected"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["active", "paused", "completed"]);
export const donationStatusEnum = pgEnum("donation_status", ["pending", "confirmed", "failed"]);
export const milestoneStatusEnum = pgEnum("milestone_status", ["pending", "approved", "paid"]);

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("donor"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── NGOs ────────────────────────────────────────────────────────────────────
export const ngos = pgTable("ngos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  registrationNumber: text("registration_number"),
  description: text("description"),
  badge: badgeEnum("badge").notNull().default("platform"),
  baseLat: numeric("base_lat", { precision: 10, scale: 7 }),
  baseLng: numeric("base_lng", { precision: 10, scale: 7 }),
  address: text("address"),
  website: text("website"),
  phone: text("phone"),
  docs: jsonb("docs").$type<{
    certificate?: string;
    taxDoc?: string;
    disasterHistory?: string;
  }>().default({}),
  status: ngoStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Disasters ───────────────────────────────────────────────────────────────
export const disasters = pgTable("disasters", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // flood, landslide, drought, cyclone, earthquake
  name: text("name").notNull(),
  location: text("location").notNull(),
  centerLat: numeric("center_lat", { precision: 10, scale: 7 }),
  centerLng: numeric("center_lng", { precision: 10, scale: 7 }),
  severityZones: jsonb("severity_zones").$type<FeatureCollection>(),
  severity: integer("severity").notNull().default(1), // 1=Low, 2=Moderate, 3=High, 4=Critical
  sourceLink: text("source_link"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Campaigns ───────────────────────────────────────────────────────────────
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  ngoId: uuid("ngo_id").references(() => ngos.id, { onDelete: "cascade" }).notNull(),
  disasterId: uuid("disaster_id").references(() => disasters.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  goal: numeric("goal", { precision: 12, scale: 2 }).notNull(),
  cap: numeric("cap", { precision: 12, scale: 2 }),
  raised: numeric("raised", { precision: 12, scale: 2 }).notNull().default("0"),
  status: campaignStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Needs ───────────────────────────────────────────────────────────────────
export const needs = pgTable("needs", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  item: text("item").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
});

// ─── Donations ───────────────────────────────────────────────────────────────
export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  donorId: uuid("donor_id").references(() => users.id),
  campaignId: uuid("campaign_id").references(() => campaigns.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  paypalOrderId: text("paypal_order_id"),
  status: donationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

// ─── Milestones ───────────────────────────────────────────────────────────────
export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: milestoneStatusEnum("status").notNull().default("pending"),
  payoutId: text("payout_id"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Proofs ───────────────────────────────────────────────────────────────────
export const proofs = pgTable("proofs", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  fileUrl: text("file_url").notNull(),
  caption: text("caption"),
  exifTime: timestamp("exif_time"),
  exifGps: jsonb("exif_gps").$type<{ lat: number; lng: number }>(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id).notNull(),
  donorId: uuid("donor_id").references(() => users.id),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Processed Webhook Events (idempotency) ───────────────────────────────────
export const processedWebhookEvents = pgTable("processed_webhook_events", {
  id: text("id").primaryKey(), // PayPal event ID
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  ngo: one(ngos, { fields: [users.id], references: [ngos.userId] }),
  donations: many(donations),
  reports: many(reports),
}));

export const ngosRelations = relations(ngos, ({ one, many }) => ({
  user: one(users, { fields: [ngos.userId], references: [users.id] }),
  campaigns: many(campaigns),
}));

export const disastersRelations = relations(disasters, ({ many }) => ({
  campaigns: many(campaigns),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  ngo: one(ngos, { fields: [campaigns.ngoId], references: [ngos.id] }),
  disaster: one(disasters, { fields: [campaigns.disasterId], references: [disasters.id] }),
  needs: many(needs),
  donations: many(donations),
  milestones: many(milestones),
  proofs: many(proofs),
  expenses: many(expenses),
  reports: many(reports),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  donor: one(users, { fields: [donations.donorId], references: [users.id] }),
  campaign: one(campaigns, { fields: [donations.campaignId], references: [campaigns.id] }),
}));
