/**
 * Shared API Contract Types for ReliefTrack
 * Exact types matching 01-FRONTEND.md Part B2
 */

export type Disaster = {
  id: string;
  name: string;
  type: string;
  severity: 2 | 3 | 4;
  lat: number;
  lng: number;
  casualties: number;
  teamsDeployed: number;
  status: "active" | "closed";
};

export type RankedNgo = {
  ngoId: string;
  name: string;
  badge: "GOVT" | "PLATFORM" | "NONE";
  score: number; // 0-100
  breakdown: {
    proximity: number;
    delivery: number;
    capUtilization: number;
    badgeBonus: number;
  };
  distanceKm: number;
  campaignId: string;
  raised: number;
  cap: number;
  whyThisRank: string;
};

export type Milestone = {
  step: 1 | 2 | 3 | 4;
  label: string;
  done: boolean;
  at?: string;
};

export type DonationSummary = {
  id: string;
  amount: number;
  currency: "INR" | "USD";
  status: "pending" | "escrow" | "released" | "failed";
  milestones: Milestone[];
};

export type ProofItem = {
  id: string;
  imageUrl: string;
  lat?: number;
  lng?: number;
  takenAt?: string;
  ngoName: string;
  verified: boolean;
};

// Additional helper frontend response contracts
export type TransparencyMetrics = {
  activeDisasters?: number;
  verifiedNgos?: number;
  totalRaisedINR?: number;
  totalDonated?: number;
  verifiedDeliveries?: number;
  verifiedProofs?: number;
  fundsReleased?: number;
  activeCampaigns?: number;
  donationCount?: number;
  donorCount?: number;
};

export type TransparencyDisbursement = {
  id: string;
  ngoName: string;
  campaignTitle?: string;
  disasterName?: string;
  milestoneTitle?: string;
  amount: number;
  amountINR?: number;
  releasedAt: string | null;
  payoutId?: string | null;
  note?: string | null;
};

export type TransparencyData = {
  metrics: TransparencyMetrics;
  proofs: ProofItem[];
  disbursements: TransparencyDisbursement[];
};

export type DonorImpactDonation = {
  donationId: string;
  amount: number;
  tipAmount?: number;
  currency: string;
  status: "pending" | "escrow" | "released" | "failed";
  createdAt: string;
  confirmedAt: string | null;
  campaign: {
    id: string;
    title: string;
    raised: number;
    cap: number;
    goal: number;
    status: string;
  };
  ngo: {
    id: string;
    name: string;
    badge: string;
  };
  disaster: {
    id: string;
    name: string;
    type: string;
    severity: number;
  };
  milestones: {
    total: number;
    completed: number;
  };
  verifiedProofs: { fileUrl: string; lat?: number; lng?: number }[];
};

export type DonorImpactData = {
  totalDonatedINR: number;
  totalDonatedUSD: number;
  donationsCount: number;
  donations: DonorImpactDonation[];
};

export type InventoryBudgetItem = {
  name: string;
  category: "food" | "water" | "medical" | "shelter" | "clothing" | "hygiene" | "logistics" | "other";
  quantity: number;
  unit: string;
  unitCostINR: number;
  totalINR: number;
};

export type InventoryBudget = {
  items: InventoryBudgetItem[];
  totalINR: number;
  warnings: string[];
};

export type AdminApplication = {
  id: string;
  name: string;
  badge: "govt" | "platform";
  status: "pending" | "approved" | "rejected";
  address: string | null;
  registrationNumber: string | null;
  docs: { certificate?: string; taxDoc?: string; disasterHistory?: string };
  createdAt: string;
  rejectionReason: string | null;
  userEmail: string | null;
  userName: string | null;
};
