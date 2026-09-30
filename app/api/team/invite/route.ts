import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InviteSchema } from "@/features/team/schema";
import { rateLimit, RATE_LIMITS, getRateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(getRateLimitKey(req as unknown as Request, userId), RATE_LIMITS.workspaceWrite);
  if (!rl.success) {
    return NextResponse.json({ error: "Too Many Requests" }, {
      status: 429,
      headers: { ...rateLimitHeaders(rl), "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422, headers: rateLimitHeaders(rl) });
  }

  // Stateless echo — persist in v1.4.1 with db.teamInvite.create
  return NextResponse.json({ success: true, data: parsed.data }, { status: 201, headers: rateLimitHeaders(rl) });
}
