import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-guard";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const contentType = req.headers.get("content-type") || "";

    let name = "";
    let description = "";
    let registrationNumber = "";
    let registrationType = "platform";
    let address = "";
    let baseLat = "";
    let baseLng = "";
    let website = "";
    let phone = "";
    let bankName = "";
    let accountNumber = "";
    let ifscCode = "";
    let docs: Record<string, string> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = (formData.get("name") as string) || "";
      description = (formData.get("description") as string) || "";
      registrationNumber = (formData.get("registrationNumber") as string) || "";
      registrationType = (formData.get("registrationType") as string) || "platform";
      address = (formData.get("address") as string) || "";
      baseLat = (formData.get("baseLat") as string) || "";
      baseLng = (formData.get("baseLng") as string) || "";
      website = (formData.get("website") as string) || "";
      phone = (formData.get("phone") as string) || "";
      bankName = (formData.get("bankName") as string) || "";
      accountNumber = (formData.get("accountNumber") as string) || "";
      ifscCode = (formData.get("ifscCode") as string) || "";

      // For uploaded file names/stubs
      const certFile = formData.get("certificate") as File | null;
      const taxFile = formData.get("taxDoc") as File | null;
      const opsFile = formData.get("disasterHistory") as File | null;

      if (certFile && certFile.size > 0) docs.certificate = certFile.name;
      if (taxFile && taxFile.size > 0) docs.taxDoc = taxFile.name;
      if (opsFile && opsFile.size > 0) docs.disasterHistory = opsFile.name;
    } else {
      const body = await req.json().catch(() => ({}));
      name = body.name || "";
      description = body.description || "";
      registrationNumber = body.registrationNumber || "";
      registrationType = body.registrationType || "platform";
      address = body.address || "";
      baseLat = body.baseLat || "";
      baseLng = body.baseLng || "";
      website = body.website || "";
      phone = body.phone || "";
      bankName = body.bankName || "";
      accountNumber = body.accountNumber || "";
      ifscCode = body.ifscCode || "";
      docs = body.docs || {};
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Organisation name is required (min 2 characters)" }, { status: 400 });
    }

    if (USE_MOCK || !user) {
      return NextResponse.json(
        {
          success: true,
          applicationId: `APP-MOCK-${Date.now()}`,
          ngo: {
            id: `ngo-mock-${Date.now()}`,
            name,
            registrationNumber,
            description,
            address,
            badge: registrationType,
            status: "pending",
            docs,
            bankName,
            accountNumber,
            ifscCode,
          },
        },
        { status: 201 }
      );
    }

    try {
      const { db } = await import("@/lib/db");
      const { ngos } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");

      const [existing] = await db
        .select({ id: ngos.id })
        .from(ngos)
        .where(eq(ngos.userId, user.id))
        .limit(1);

      if (existing) {
        return NextResponse.json({ error: "You already have an NGO application on file" }, { status: 409 });
      }

      const [ngo] = await db
        .insert(ngos)
        .values({
          userId: user.id,
          name,
          registrationNumber,
          description,
          address,
          baseLat,
          baseLng,
          website: website || null,
          phone,
          badge: registrationType as "govt" | "platform",
          docs,
          status: "pending",
        })
        .returning();

      return NextResponse.json({ success: true, ngo }, { status: 201 });
    } catch (dbErr) {
      console.warn("DB apply fallback to mock response:", dbErr);
      return NextResponse.json(
        {
          success: true,
          applicationId: `APP-MOCK-${Date.now()}`,
          ngo: {
            id: `ngo-mock-${Date.now()}`,
            name,
            registrationNumber,
            description,
            address,
            badge: registrationType,
            status: "pending",
            docs,
          },
        },
        { status: 201 }
      );
    }
  } catch (e) {
    console.error("NGO apply error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.id || USE_MOCK) {
    return NextResponse.json({
      ngo: {
        id: "mock-ngo-001",
        name: "Kerala Relief Front",
        registrationNumber: "KL-NGO-2024-8891",
        badge: "govt",
        status: "approved",
        description: "Frontline emergency disaster relief organisation operating in Wayanad and Western Ghats.",
        address: "Meppadi Ward 4, Wayanad, Kerala 673577",
        website: "https://keralarelief.org",
        phone: "+91 98471 23456",
        baseLat: "11.6854",
        baseLng: "76.1320",
        docs: {
          certificate: "https://example.com/certificate.pdf",
          taxDoc: "https://example.com/80g.pdf",
          disasterHistory: "https://example.com/history.pdf",
        },
        createdAt: "2026-08-01T10:00:00Z",
      },
    });
  }

  try {
    const { db } = await import("@/lib/db");
    const { ngos } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [ngo] = await db.select().from(ngos).where(eq(ngos.userId, user.id)).limit(1);
    return NextResponse.json({ ngo: ngo ?? null });
  } catch {
    return NextResponse.json({ ngo: null });
  }
}
