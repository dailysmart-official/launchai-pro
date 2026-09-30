import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ApiKeyNameSchema } from "@/features/team/schema";
import { rateLimit, RATE_LIMITS, getRateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskedFromName(name: string): string {
  return `sk_live_****${name.slice(0, 4)}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(getRateLimitKey(req as unknown as Request, userId), RATE_LIMITS.aiRead);
  if (!rl.success) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  // Stateless mock list
  const keys = [
    { id: "k1", name: "Production", masked: maskedFromName("Production"), createdAt: new Date().toISOString() },
  ];
  return NextResponse.json({ keys }, { headers: rateLimitHeaders(rl) });
}

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

  const parsed = ApiKeyNameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422, headers: rateLimitHeaders(rl) });
  }

  // In production: const raw = `sk_live_${crypto.randomUUID().replace(/-/g,"")}`; hashed SHA256 stored, raw returned once.
  const maskedKey = maskedFromName(parsed.data.name);
  return NextResponse.json({ success: true, maskedKey, name: parsed.data.name }, { status: 201, headers: rateLimitHeaders(rl) });
}
