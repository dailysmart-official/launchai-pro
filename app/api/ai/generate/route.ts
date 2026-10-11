import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSchema } from "@/lib/validations/ai-writer";
import { generateContent } from "@/modules/ai-writer/service";
import { rateLimit, RATE_LIMITS, getRateLimitKey, rateLimitHeaders } from "@/lib/rate-limit";
import { classifyAiError, AI_ERROR_MESSAGES } from "@/lib/openai";

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
      return NextResponse.json({ error: "Rate limited — too many requests. Please wait a minute and try again.", code: "rate_limited" }, {
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
      { id: result.id, result: result.content, title: result.title, tokens: result.tokens, truncated: result.truncated },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error: unknown) {
    const providerError = classifyAiError(error);
    if (providerError) {
      // Log provider details server-side only; the client gets a stable code + friendly message.
      console.error("[AI_GENERATE_PROVIDER_ERROR]", providerError.code, error instanceof Error ? error.message : error);
      return NextResponse.json(
        { error: AI_ERROR_MESSAGES[providerError.code], code: providerError.code },
        { status: providerError.status }
      );
    }
    const message = error instanceof Error ? error.message : "";
    if (message === "AI_EMPTY_OUTPUT_LENGTH") {
      return NextResponse.json(
        { error: "The model reached its length limit before writing any text. Please try again or use a different model.", code: "output_truncated" },
        { status: 502 }
      );
    }
    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "AI generation needs an API key. See README.", code: "not_configured" }, { status: 503 });
    }
    console.error("[AI_GENERATE_ERROR]", error);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
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
