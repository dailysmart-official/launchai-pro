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

/** Optional AI_FALLBACK_MODELS (comma-separated), tried in order when the primary model fails. */
export function getAiFallbackModels(): string[] {
  const primary = getAiModel();
  const models = (process.env.AI_FALLBACK_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m && m !== primary);
  return [...new Set(models)];
}

/** Provider statuses worth retrying on another model: rate limited (429) or model not found (404). */
export function isRetryableWithFallback(error: unknown): boolean {
  return error instanceof OpenAI.APIError && (error.status === 429 || error.status === 404);
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

export type AiErrorCode = "model_unavailable" | "no_credits" | "rate_limited" | "invalid_key" | "provider_error";

export const AI_ERROR_MESSAGES: Record<AiErrorCode, string> = {
  model_unavailable: "Model unavailable — the configured AI model was not found at the provider. Check AI_MODEL.",
  no_credits: "No credits — the AI provider account has run out of credits.",
  rate_limited: "Rate limited — too many requests to the AI provider. Please try again in a minute.",
  invalid_key: "The AI provider rejected the API key. Check OPENAI_API_KEY.",
  provider_error: "The AI provider returned an error. Please try again.",
};

/** Map an AI provider (OpenAI SDK) error to a stable code + HTTP status. Null if it is not a provider error. */
export function classifyAiError(error: unknown): { code: AiErrorCode; status: number } | null {
  if (!(error instanceof OpenAI.APIError) || typeof error.status !== "number") return null;
  switch (error.status) {
    case 404:
      return { code: "model_unavailable", status: 502 };
    case 402:
      return { code: "no_credits", status: 502 };
    case 429:
      return { code: "rate_limited", status: 429 };
    case 401:
    case 403:
      return { code: "invalid_key", status: 502 };
    default:
      return { code: "provider_error", status: 502 };
  }
}
