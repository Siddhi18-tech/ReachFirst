export type Disaster = { id: string; name: string; type: string; severity: 2|3|4; lat: number; lng: number; casualties: number; teamsDeployed: number; status: 'active'|'closed' };

export type RankedNgo = {
  ngoId: string; name: string; badge: 'GOVT'|'PLATFORM'|'NONE'; score: number;
  breakdown: { proximity: number; delivery: number; capUtilization: number; badgeBonus: number };
  distanceKm: number; campaignId: string; raised: number; cap: number; whyThisRank: string;
};

export type Milestone = { step: 1|2|3|4; label: string; done: boolean; at?: string };

export type DonationSummary = { id: string; amount: number; currency: 'INR'|'USD'; status: 'pending'|'escrow'|'released'|'failed'; milestones: Milestone[] };

export type ProofItem = { id: string; imageUrl: string; lat?: number; lng?: number; takenAt?: string; ngoName: string; verified: boolean };