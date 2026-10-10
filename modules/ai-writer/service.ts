import { getOpenAI, getAiModel } from "@/lib/openai";
import { db } from "@/lib/db";
import { MODEL_CONFIG, SYSTEM_PROMPTS } from "./config";
import type { GenerateInput, WriterTone, WriterType } from "@/lib/validations/ai-writer";
import type { GenerationTone, GenerationType } from "@prisma/client";

// Map Zod string enums (kebab-case) → Prisma strict enums (UPPER_SNAKE)
const toneMap: Record<WriterTone, GenerationTone> = {
  professional: "PROFESSIONAL",
  casual: "CASUAL",
  witty: "CREATIVE",
  persuasive: "PERSUASIVE",
  informative: "FORMAL",
};

const typeMap: Record<WriterType, GenerationType> = {
  "blog-post": "BLOG_POST",
  "ad-copy": "AD_COPY",
  email: "EMAIL_COPY",
  "social-post": "SOCIAL_MEDIA",
  "product-description": "PRODUCT_DESCRIPTION",
  "landing-page": "SEO_ARTICLE",
};

export interface GenerationResult {
  id: string;
  content: string;
  title?: string | null;
  tokens?: number | null;
}

/**
 * Core AI Writer service — handles OpenAI calls + persistence.
 * Separated from the API route for testability and reusability.
 */
export async function generateContent(userId: string, input: GenerateInput): Promise<GenerationResult> {
  const openai = getOpenAI();
  const systemPrompt = SYSTEM_PROMPTS[input.type];

  const userPrompt = `Tone: ${input.tone}\nLanguage: ${input.language}\nType: ${input.type}\nBrief:\n${input.prompt}\n\nWrite the content now. Start with a compelling title on the first line prefixed with "Title: ".`;

  const completion = await openai.chat.completions.create({
    model: getAiModel(),
    temperature: MODEL_CONFIG.temperature,
    max_tokens: MODEL_CONFIG.maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) throw new Error("Empty response from AI provider");

  // Extract title if present
  let title: string | null = null;
  let content = raw;
  const titleMatch = raw.match(/^Title:\s*(.+)$/m);
  if (titleMatch) {
    const rawTitle = titleMatch[1];
    const fullMatch = titleMatch[0];
    if (rawTitle && fullMatch) {
      title = rawTitle.trim();
      content = raw.replace(fullMatch, "").trim();
    }
  }

  const tokens = completion.usage?.total_tokens ?? null;

  const record = await db.aIGeneration.create({
    data: {
      userId,
      prompt: input.prompt,
      result: content,
      tone: toneMap[input.tone],
      type: typeMap[input.type],
      language: input.language,
      title,
      tokens,
    },
  });

  return { id: record.id, content, title, tokens };
}

export async function listGenerations(userId: string, limit = 20) {
  return db.aIGeneration.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getGeneration(userId: string, id: string) {
  return db.aIGeneration.findFirst({ where: { id, userId } });
}

export async function deleteGeneration(userId: string, id: string) {
  return db.aIGeneration.deleteMany({ where: { id, userId } });
}
