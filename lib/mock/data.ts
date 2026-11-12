import type {
  Disaster,
  RankedNgo,
  DonationSummary,
  ProofItem,
  TransparencyData,
  DonorImpactData,
  InventoryBudget,
} from "@/types/api";

export const mockDisasters: Disaster[] = [
  {
    id: "d1000000-0000-0000-0000-000000000001",
    name: "Wayanad Landslides Crisis",
    type: "landslide",
    severity: 4,
    lat: 11.6854,
    lng: 76.132,
    casualties: 420,
    teamsDeployed: 28,
    status: "active",
  },
  {
    id: "d1000000-0000-0000-0000-000000000002",
    name: "Assam Brahmaputra Inundation",
    type: "flood",
    severity: 3,
    lat: 26.2006,
    lng: 92.9376,
    casualties: 98,
    teamsDeployed: 19,
    status: "active",
  },
  {
    id: "d1000000-0000-0000-0000-000000000003",
    name: "Coastal Odisha Cyclone Storm Surge",
    type: "cyclone",
    severity: 3,
    lat: 19.8135,
    lng: 85.8312,
    casualties: 14,
    teamsDeployed: 34,
    status: "active",
  },
  {
    id: "d1000000-0000-0000-0000-000000000004",
    name: "Marathwada Drought Relief",
    type: "drought",
    severity: 2,
    lat: 19.8762,
    lng: 75.3433,
    casualties: 0,
    teamsDeployed: 12,
    status: "active",
  },
];

export const mockRankedNgos: RankedNgo[] = [
  {
    ngoId: "n1000000-0000-0000-0000-000000000001",
    name: "Kerala Relief Front",
    badge: "GOVT",
    score: 94,
    breakdown: {
      proximity: 38,
      delivery: 28,
      capUtilization: 18,
      badgeBonus: 10,
    },
    distanceKm: 24,
    campaignId: "c1000000-0000-0000-0000-000000000001",
    raised: 280000,
    cap: 1000000,
    whyThisRank:
      "Government-accredited NGO stationed 24 km from the crisis epicenter. 93% verified delivery rate with high urgent capacity remaining.",
  },
  {
    ngoId: "n1000000-0000-0000-0000-000000000002",
    name: "Rapid Response India",
    badge: "PLATFORM",
    score: 83,
    breakdown: {
      proximity: 34,
      delivery: 26,
      capUtilization: 17,
      badgeBonus: 6,
    },
    distanceKm: 78,
    campaignId: "c1000000-0000-0000-0000-000000000002",
    raised: 150000,
    cap: 800000,
    whyThisRank:
      "Platform-verified NGO stationed 78 km from the epicenter. Demonstrated fast mobilization with 12 audited relief dispatches.",
  },
  {
    ngoId: "n1000000-0000-0000-0000-000000000003",
    name: "Seva Bharati Disaster Cell",
    badge: "GOVT",
    score: 79,
    breakdown: {
      proximity: 29,
      delivery: 24,
      capUtilization: 16,
      badgeBonus: 10,
    },
    distanceKm: 142,
    campaignId: "c1000000-0000-0000-0000-000000000003",
    raised: 420000,
    cap: 1200000,
    whyThisRank:
      "Government-accredited NGO operating secondary logistical warehouse 142 km out. Strong field personnel presence.",
  },
];

export const mockDonationSummaries: DonationSummary[] = [
  {
    id: "don-001",
    amount: 5000,
    currency: "INR",
    status: "released",
    milestones: [
      { step: 1, label: "Payment received", done: true, at: "2026-08-01T10:30:00Z" },
      { step: 2, label: "Held in escrow", done: true, at: "2026-08-01T10:30:00Z" },
      { step: 3, label: "Field proof verified by admin", done: true, at: "2026-08-02T14:15:00Z" },
      { step: 4, label: "Funds released to NGO", done: true, at: "2026-08-02T16:00:00Z" },
    ],
  },
  {
    id: "don-002",
    amount: 2500,
    currency: "INR",
    status: "escrow",
    milestones: [
      { step: 1, label: "Payment received", done: true, at: "2026-08-03T09:12:00Z" },
      { step: 2, label: "Held in escrow", done: true, at: "2026-08-03T09:12:00Z" },
      { step: 3, label: "Field proof verified by admin", done: false },
      { step: 4, label: "Funds released to NGO", done: false },
    ],
  },
];

export const mockProofItems: ProofItem[] = [
  {
    id: "p-01",
    imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
    lat: 11.6841,
    lng: 76.1302,
    takenAt: "2026-08-02T12:30:00Z",
    ngoName: "Kerala Relief Front",
    verified: true,
  },
  {
    id: "p-02",
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    lat: 26.211,
    lng: 92.9412,
    takenAt: "2026-08-01T16:45:00Z",
    ngoName: "Rapid Response India",
    verified: true,
  },
  {
    id: "p-03",
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
    lat: 19.821,
    lng: 85.834,
    takenAt: "2026-07-30T10:15:00Z",
    ngoName: "Seva Bharati Disaster Cell",
    verified: true,
  },
];

export const mockTransparency: TransparencyData = {
  metrics: {
    activeDisasters: 4,
    verifiedNgos: 18,
    totalRaisedINR: 1425000,
    totalDonated: 1425000,
    verifiedDeliveries: 46,
    verifiedProofs: 46,
    fundsReleased: 980000,
    activeCampaigns: 7,
    donationCount: 312,
    donorCount: 284,
  },
  proofs: mockProofItems,
  disbursements: [
    {
      id: "disb-1",
      ngoName: "Kerala Relief Front",
      campaignTitle: "Emergency Meal Kits & Tarpaulins",
      disasterName: "Wayanad Landslides Crisis",
      milestoneTitle: "Procure and distribute 500 dry ration kits",
      amount: 150000,
      amountINR: 150000,
      releasedAt: "2026-08-02T16:00:00Z",
      payoutId: "PAYOUT-KRF-001",
      note: "Disbursed following verified geotagged distribution photos.",
    },
    {
      id: "disb-2",
      ngoName: "Rapid Response India",
      campaignTitle: "Brahmaputra Flood Evacuation & Clean Water",
      disasterName: "Assam Brahmaputra Inundation",
      milestoneTitle: "Install 4 community water purification filters",
      amount: 80000,
      amountINR: 80000,
      releasedAt: "2026-08-01T14:20:00Z",
      payoutId: "PAYOUT-RRI-002",
      note: "Admin verified GPS location matched inundated cluster.",
    },
  ],
};

export const mockDonorImpact: DonorImpactData = {
  totalDonatedINR: 7500,
  totalDonatedUSD: 0,
  donationsCount: 2,
  donations: [
    {
      donationId: "don-001",
      amount: 5000,
      tipAmount: 250,
      currency: "INR",
      status: "released",
      createdAt: "2026-08-01T10:30:00Z",
      confirmedAt: "2026-08-01T10:30:00Z",
      campaign: {
        id: "c1000000-0000-0000-0000-000000000001",
        title: "Emergency Meal Kits & Tarpaulins",
        raised: 280000,
        cap: 1000000,
        goal: 1000000,
        status: "active",
      },
      ngo: {
        id: "n1000000-0000-0000-0000-000000000001",
        name: "Kerala Relief Front",
        badge: "govt",
      },
      disaster: {
        id: "d1000000-0000-0000-0000-000000000001",
        name: "Wayanad Landslides Crisis",
        type: "landslide",
        severity: 4,
      },
      milestones: {
        total: 4,
        completed: 2,
      },
      verifiedProofs: [
        {
          fileUrl:
            "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
          lat: 11.6841,
          lng: 76.1302,
        },
      ],
    },
    {
      donationId: "don-002",
      amount: 2500,
      tipAmount: 125,
      currency: "INR",
      status: "escrow",
      createdAt: "2026-08-03T09:12:00Z",
      confirmedAt: "2026-08-03T09:12:00Z",
      campaign: {
        id: "c1000000-0000-0000-0000-000000000002",
        title: "Brahmaputra Flood Evacuation & Clean Water",
        raised: 150000,
        cap: 800000,
        goal: 800000,
        status: "active",
      },
      ngo: {
        id: "n1000000-0000-0000-0000-000000000002",
        name: "Rapid Response India",
        badge: "platform",
      },
      disaster: {
        id: "d1000000-0000-0000-0000-000000000002",
        name: "Assam Brahmaputra Inundation",
        type: "flood",
        severity: 3,
      },
      milestones: {
        total: 3,
        completed: 0,
      },
      verifiedProofs: [],
    },
  ],
};

export const mockInventoryBudget: InventoryBudget = {
  items: [
    {
      name: "Tarpaulins (12x18 ft heavy duty)",
      category: "shelter",
      quantity: 200,
      unit: "pieces",
      unitCostINR: 450,
      totalINR: 90000,
    },
    {
      name: "Fortified Rice Bags (25 kg)",
      category: "food",
      quantity: 100,
      unit: "bags",
      unitCostINR: 1200,
      totalINR: 120000,
    },
    {
      name: "Oral Rehydration Salts (ORS packets)",
      category: "medical",
      quantity: 1000,
      unit: "packets",
      unitCostINR: 20,
      totalINR: 20000,
    },
    {
      name: "Emergency Potable Water Cans (20L)",
      category: "water",
      quantity: 500,
      unit: "cans",
      unitCostINR: 40,
      totalINR: 20000,
    },
  ],
  totalINR: 250000,
  warnings: ["Unit costs may be estimates. Review before submitting."],
};

