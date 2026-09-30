import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS, getRateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id && !(session?.user as { id?: string })?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session!.user as { id: string }).id;
  const rl = rateLimit(getRateLimitKey(req, userId), RATE_LIMITS.aiRead);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { ...rateLimitHeaders(rl), "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }
  // IDOR prevention: ownership enforced via userId in WHERE clause
  const { id } = await params;
  const item = await db.aIGeneration.findFirst({ where: { id, userId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item, { headers: rateLimitHeaders(rl) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id && !(session?.user as { id?: string })?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session!.user as { id: string }).id;
  const rl = rateLimit(getRateLimitKey(req, userId), RATE_LIMITS.aiRead);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { ...rateLimitHeaders(rl), "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }
  // IDOR prevention: deleteMany with { id, userId } never deletes another user's record
  const { id } = await params;
  const res = await db.aIGeneration.deleteMany({ where: { id, userId } });
  if (res.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true }, { headers: rateLimitHeaders(rl) });
}
