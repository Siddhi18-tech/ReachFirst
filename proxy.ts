import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;
  const role = session?.user?.role;

  // Public paths - always allowed
  const publicPaths = [
    "/", "/login", "/register", "/transparency", "/map", "/disasters", "/donate",
    "/api/auth", "/api/webhooks/paypal", "/api/donations/create-order", "/api/donations/capture-order",
  ];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }
  if (/^\/api\/campaigns\/[^/]+\/report$/.test(pathname)) return NextResponse.next();

  // Not logged in — redirect to login
  if (!session) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
  }

  // Role-based access control
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/ngo") && role !== "ngo" && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/donor") && role !== "donor" && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
