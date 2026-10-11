import type { WriterType, WriterTone } from "@/lib/validations/ai-writer";

export const WRITER_TYPE_OPTIONS: { value: WriterType; label: string; description: string }[] = [
  { value: "blog-post", label: "Blog Post", description: "SEO-optimized long-form article" },
  { value: "ad-copy", label: "Ad Copy", description: "High-converting ad headlines & body" },
  { value: "email", label: "Email", description: "Persuasive email sequences" },
  { value: "social-post", label: "Social Post", description: "Engaging social media content" },
  { value: "product-description", label: "Product Description", description: "Compelling product storytelling" },
  { value: "landing-page", label: "Landing Page", description: "Full landing page copy" },
];

export const WRITER_TONE_OPTIONS: { value: WriterTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "witty", label: "Witty" },
  { value: "persuasive", label: "Persuasive" },
  { value: "informative", label: "Informative" },
];

export const SYSTEM_PROMPTS: Record<WriterType, string> = {
  "blog-post": "You are an expert SEO blog writer. Create engaging, well-structured blog content with headings and bullet points where appropriate.",
  "ad-copy": "You are a world-class direct-response copywriter. Write short, punchy, high-converting ad copy with clear CTAs.",
  email: "You are an email marketing expert. Write personalized, high-open-rate email copy with subject line suggestions.",
  "social-post": "You are a social media strategist. Write viral, concise, platform-optimized social posts with hashtags.",
  "product-description": "You are a product storyteller. Write benefit-driven, emotion-triggered product descriptions that convert.",
  "landing-page": "You are a landing page specialist. Write above-the-fold hero, benefits, social proof and CTA sections.",
};

export const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "French", label: "French" },
  { value: "Spanish", label: "Spanish" },
  { value: "German", label: "German" },
  { value: "Arabic", label: "Arabic" },
] as const;

export const MODEL_CONFIG = {
  model: "gpt-4o-mini", // default; override with the AI_MODEL env var
  temperature: 0.7,
} as const;

/**
 * Output token limit per content type. Generous on purpose: reasoning models
 * (common among free OpenRouter models) spend part of this budget on hidden reasoning.
 */
export const MAX_TOKENS_BY_TYPE: Record<WriterType, number> = {
  "blog-post": 4096,
  "landing-page": 4096,
  email: 2048,
  "product-description": 1536,
  "ad-copy": 1024,
  "social-post": 1024,
};
