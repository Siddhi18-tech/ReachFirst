import type {
  Disaster,
  RankedNgo,
  DonationSummary,
  ProofItem,
  TransparencyData,
  DonorImpactData,
  InventoryBudget,
  AdminApplication,
} from "@/types/api";

import {
  mockDisasters,
  mockRankedNgos,
  mockTransparency,
  mockDonorImpact,
  mockInventoryBudget,
} from "./mock/data";

/**
 * Global mock toggle. Flip via NEXT_PUBLIC_USE_MOCK=true in .env
 * Defaults to false so live backend is called by default.
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `Request to ${endpoint} failed with status ${res.status}`;
    let details: unknown;
    try {
      const data = await res.json();
      if (data?.error) errMessage = data.error;
      details = data;
    } catch {
      // not JSON
    }
    throw new ApiError(errMessage, res.status, details);
  }

  return (await res.json()) as T;
}

// ─── Disasters ───────────────────────────────────────────────────────────────

export async function getDisasters(): Promise<Disaster[]> {
  if (USE_MOCK) return mockDisasters;
  try {
    return await request<Disaster[]>("/api/disasters");
  } catch (err) {
    console.warn("getDisasters fallback to mock:", err);
    return mockDisasters;
  }
}

export async function getDisaster(id: string): Promise<Disaster> {
  if (USE_MOCK) {
    const found = mockDisasters.find((d) => d.id === id);
    if (!found) throw new ApiError("Disaster not found", 404);
    return found;
  }
  try {
    return await request<Disaster>(`/api/disasters/${id}`);
  } catch (err) {
    console.warn(`getDisaster(${id}) fallback to mock:`, err);
    const found = mockDisasters.find((d) => d.id === id) ?? mockDisasters[0];
    return found;
  }
}

export async function getRankedNgos(disasterId: string): Promise<RankedNgo[]> {
  if (USE_MOCK) return mockRankedNgos;
  try {
    return await request<RankedNgo[]>(`/api/disasters/${disasterId}/ngos`);
  } catch (err) {
    console.warn(`getRankedNgos(${disasterId}) fallback to mock:`, err);
    return mockRankedNgos;
  }
}

// ─── Donations & Escrow ───────────────────────────────────────────────────────

export type CreateOrderParams = {
  campaignId: string;
  amount: number;
  tipAmount?: number;
  currency?: "INR" | "USD";
};

export type CreateOrderResponse = {
  orderId: string;
  donationId: string;
  amount: number;
  tipAmount?: number;
  currency: "INR" | "USD";
  approvalUrl?: string | null;
};

export async function createDonationOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  if (USE_MOCK) {
    return {
      orderId: `MOCK-ORDER-${Date.now()}`,
      donationId: `MOCK-DONATION-${Date.now()}`,
      amount: params.amount,
      tipAmount: params.tipAmount ?? 0,
      currency: params.currency ?? "INR",
      approvalUrl: null,
    };
  }

  return await request<CreateOrderResponse>("/api/donations/create-order", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function captureDonation(orderId: string): Promise<DonationSummary> {
  if (USE_MOCK) {
    return {
      id: orderId,
      amount: 1000,
      currency: "INR",
      status: "escrow",
      milestones: [
        { step: 1, label: "Payment received", done: true, at: new Date().toISOString() },
        { step: 2, label: "Held in escrow", done: true, at: new Date().toISOString() },
        { step: 3, label: "Field proof verified by admin", done: false },
        { step: 4, label: "Funds released to NGO", done: false },
      ],
    };
  }

  return await request<DonationSummary>("/api/donations/capture", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

export async function getDonorImpact(): Promise<DonorImpactData> {
  if (USE_MOCK) return mockDonorImpact;
  try {
    return await request<DonorImpactData>("/api/donor/impact");
  } catch (err) {
    console.warn("getDonorImpact fallback to mock:", err);
    return mockDonorImpact;
  }
}

// ─── Transparency ─────────────────────────────────────────────────────────────

export async function getTransparency(): Promise<TransparencyData> {
  if (USE_MOCK) return mockTransparency;
  try {
    return await request<TransparencyData>("/api/transparency");
  } catch (err) {
    console.warn("getTransparency fallback to mock:", err);
    return mockTransparency;
  }
}

// ─── NGO Portal ───────────────────────────────────────────────────────────────

export async function parseInventoryAi(text: string): Promise<InventoryBudget> {
  if (USE_MOCK) return mockInventoryBudget;
  try {
    const res = await request<{
      success: boolean;
      items: InventoryBudget["items"];
      totalINR: number;
      warnings: string[];
    }>("/api/ngo/inventory-ai", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    return {
      items: res.items,
      totalINR: res.totalINR,
      warnings: res.warnings ?? [],
    };
  } catch (err) {
    console.warn("parseInventoryAi fallback to mock:", err);
    return mockInventoryBudget;
  }
}

export async function getNgoProfile(): Promise<unknown> {
  if (USE_MOCK) {
    return {
      ngo: {
        id: "mock-ngo-id",
        name: "Kerala Relief Front",
        registrationNumber: "REG-KL-2024-8891",
        badge: "govt",
        status: "approved",
      },
      campaigns: [],
    };
  }
  return await request("/api/ngo/profile");
}

export async function applyNgo(formData: FormData): Promise<{ ok: boolean; applicationId?: string }> {
  if (USE_MOCK) {
    return { ok: true, applicationId: `MOCK-APP-${Date.now()}` };
  }
  return await request("/api/ngo/apply", {
    method: "POST",
    body: formData,
  });
}

export async function uploadProof(formData: FormData): Promise<{ ok: boolean; proofId?: string }> {
  if (USE_MOCK) {
    return { ok: true, proofId: `MOCK-PROOF-${Date.now()}` };
  }
  return await request("/api/proofs/upload", {
    method: "POST",
    body: formData,
  });
}

// ─── Admin Console ────────────────────────────────────────────────────────────

export async function getAdminApplications(status: "pending" | "approved" | "rejected" = "pending"): Promise<{ ngos: AdminApplication[] }> {
  if (USE_MOCK) {
    return {
      ngos: [
        {
          id: "app-1",
          name: "Himalayan Hope Trust",
          badge: "platform",
          status: "pending",
          address: "Dehradun, Uttarakhand",
          registrationNumber: "UK-NGO-8821",
          docs: { certificate: "cert.pdf", taxDoc: "12a.pdf" },
          createdAt: new Date().toISOString(),
          rejectionReason: null,
          userEmail: "contact@himalayanhope.org",
          userName: "Dr. A. Verma",
        },
      ],
    };
  }
  return await request<{ ngos: AdminApplication[] }>(`/api/admin/ngos?status=${status}`);
}

export async function decideAdminNgo(
  id: string,
  action: "approve" | "reject",
  rejectionReason?: string
): Promise<{ ok: boolean }> {
  if (USE_MOCK) return { ok: true };
  return await request(`/api/admin/ngo/${id}`, {
    method: "POST",
    body: JSON.stringify({ action, rejectionReason }),
  });
}

export async function getAdminProofs(): Promise<{ proofs: ProofItem[] }> {
  if (USE_MOCK) return { proofs: mockTransparency.proofs };
  return await request<{ proofs: ProofItem[] }>("/api/admin/proofs");
}

export async function verifyAdminProof(
  id: string,
  action: "approve" | "reject",
  note?: string
): Promise<{ ok: boolean }> {
  if (USE_MOCK) return { ok: true };
  return await request(`/api/admin/proofs/${id}/verify`, {
    method: "POST",
    body: JSON.stringify({ action, note }),
  });
}
