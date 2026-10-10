import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Server-side route protection.
// - Pages: unauthenticated requests get a 307 redirect to /login.
// - API routes: unauthenticated requests get a 401 JSON response (no redirect).
export default auth((req) => {
  if (req.auth?.user) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.nextUrl.origin);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl, 307);
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/writer/:path*",
    "/billing/:path*",
    "/teams/:path*",
    "/settings/:path*",
    "/api/ai/:path*",
    "/api/analytics/:path*",
    "/api/api-keys/:path*",
    "/api/team/:path*",
    "/api/workspace/:path*",
  ],
};
