import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ApiKeyNameSchema } from "@/features/team/schema";
import { rateLimit, RATE_LIMITS, getRateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Preview: API keys are not stored yet, so none are listed and none are issued.
const PREVIEW_MESSAGE = "API keys are a preview feature and are not available yet.";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(getRateLimitKey(req as unknown as Request, userId), RATE_LIMITS.aiRead);
  if (!rl.success) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  return NextResponse.json({ keys: [], preview: true }, { headers: rateLimitHeaders(rl) });
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

  return NextResponse.json({ error: PREVIEW_MESSAGE, preview: true }, { status: 501, headers: rateLimitHeaders(rl) });
}
