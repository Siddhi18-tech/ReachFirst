import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Role = "donor" | "ngo" | "admin";

export async function requireRole(role: Role | Role[]) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null; // null means OK
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireOwnership(resourceUserId: string) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Admin can access anything
  if (session.user.role === "admin") return null;
  if (session.user.id !== resourceUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
