import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSchema } from "@/lib/validations/ai-writer";
import { generateContent } from "@/modules/ai-writer/service";
import { rateLimit, RATE_LIMITS, getRateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id && !(session?.user as { id?: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session!.user as { id: string }).id;

    // Rate limiting — 10 AI generations / minute per user (cost protection)
    const rl = rateLimit(getRateLimitKey(req, userId), RATE_LIMITS.aiGenerate);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests — please slow down" }, {
        status: 429,
        headers: { ...rateLimitHeaders(rl), "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      });
    }

    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().formErrors.join(", ") || "Invalid input" }, { status: 400 });
    }

    const result = await generateContent(userId, parsed.data);
    return NextResponse.json(
      { id: result.id, result: result.content, title: result.title, tokens: result.tokens },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(req: Request) {
  try {
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

    const { db } = await import("@/lib/db");
    const items = await db.aIGeneration.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json(items, { headers: rateLimitHeaders(rl) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
