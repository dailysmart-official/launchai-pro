import OpenAI from "openai";
import { MODEL_CONFIG } from "@/modules/ai-writer/config";

let _client: OpenAI | null = null;

/** True when an API key is configured (server-side check). */
export function isAiConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return Boolean(apiKey) && !apiKey!.includes("placeholder");
}

/** Model name: AI_MODEL if set, otherwise the built-in default. */
export function getAiModel(): string {
  return process.env.AI_MODEL?.trim() || MODEL_CONFIG.model;
}

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  if (!isAiConfigured()) {
    throw new Error(
      "OPENAI_API_KEY is not configured — set your API key in .env (see .env.example)"
    );
  }
  // OPENAI_BASE_URL is optional: leave it empty for OpenAI, or point it at any
  // OpenAI-compatible provider (for example https://openrouter.ai/api/v1).
  const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined;
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY!.trim(), baseURL });
  return _client;
}

/** For tests — reset singleton */
export function _resetOpenAIClient() {
  _client = null;
}
