import { z } from "zod";

export const WRITER_TONES = ["professional", "casual", "witty", "persuasive", "informative"] as const;
export const WRITER_TYPES = [
  "blog-post",
  "ad-copy",
  "email",
  "social-post",
  "product-description",
  "landing-page",
] as const;

export const generateSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(4000),
  tone: z.enum(WRITER_TONES).default("professional"),
  type: z.enum(WRITER_TYPES).default("blog-post"),
  language: z.string().min(2).max(32).default("English"),
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type WriterTone = (typeof WRITER_TONES)[number];
export type WriterType = (typeof WRITER_TYPES)[number];
