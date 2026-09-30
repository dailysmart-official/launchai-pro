import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  // Fail loudly at runtime if placeholder — uses validated env helper
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes("placeholder")) {
    throw new Error(
      "OPENAI_API_KEY is not configured — set a real sk-... key in .env (see .env.example)"
    );
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

/** For tests — reset singleton */
export function _resetOpenAIClient() {
  _client = null;
}
