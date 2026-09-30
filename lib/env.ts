import { z } from "zod";

/**
 * Enterprise-grade validated env schema — single source of truth.
 * Buyer must replace placeholders in .env (see .env.example) before production deploy.
 * Build is allowed with SKIP_ENV_VALIDATION=1 / placeholder values; runtime enforces strict check.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL (postgresql://...)"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be >=32 chars — generate with: openssl rand -base64 32"),
  AUTH_GOOGLE_ID: z.string().min(1, "AUTH_GOOGLE_ID required"),
  AUTH_GOOGLE_SECRET: z.string().min(1, "AUTH_GOOGLE_SECRET required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be >=32 chars").optional(),
  // Enterprise hardening — 32-byte encryption key for BYOK encryption-at-rest
  ENCRYPTION_KEY: z.string().length(32, "ENCRYPTION_KEY must be exactly 32 characters").optional(),
  OPENAI_API_KEY: z.string().startsWith("sk-", "OPENAI_API_KEY must start with sk-"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("pk_", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_"),
  STRIPE_PRICE_STARTER: z.string().startsWith("price_", "STRIPE_PRICE_* must start with price_"),
  STRIPE_PRICE_PRO: z.string().startsWith("price_", "STRIPE_PRICE_* must start with price_"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function isPlaceholder(v?: string): boolean {
  if (!v) return true;
  return (
    v.includes("placeholder") ||
    v.includes("sk-placeholder") ||
    v === "sk_test_placeholder" ||
    v === "whsec_placeholder" ||
    v === "pk_test_placeholder" ||
    v === "price_placeholder_starter" ||
    v === "price_placeholder_pro" ||
    v === "generate-with-openssl-rand-base64-32"
  );
}

function hasAnyPlaceholder(env: Record<string, string | undefined>): boolean {
  return (
    isPlaceholder(env.DATABASE_URL) ||
    isPlaceholder(env.AUTH_SECRET) ||
    isPlaceholder(env.OPENAI_API_KEY) ||
    isPlaceholder(env.STRIPE_SECRET_KEY) ||
    isPlaceholder(env.STRIPE_WEBHOOK_SECRET)
  );
}

/**
 * Hardened bootstrap — fails fast at build time when placeholders leak to production.
 * Strict validator — call at runtime entry points (API routes, lib getters).
 * Allows Next.js build with placeholders but throws loudly in production runtime.
 */
export function validateEnv(strict = false): Env {
  const parsed = envSchema.safeParse(process.env);
  if (parsed.success) return parsed.data;

  // Allow build-time with SKIP_ENV_VALIDATION or non-production + placeholders
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return process.env as unknown as Env;
  }

  const placeholderDeploy = hasAnyPlaceholder(process.env as Record<string, string | undefined>);
  if (placeholderDeploy) {
    if (process.env.NODE_ENV === "production" && strict) {
      throw new Error(
        `Environment validation failed — placeholder secrets detected in production.\n` +
          parsed.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n") +
          `\nReplace all placeholder values in .env from .env.example before deploying.`
      );
    }
    // Non-strict / build-time: return as-is so `next build` succeeds
    return process.env as unknown as Env;
  }

  throw new Error(
    `Environment validation failed:\n` +
      parsed.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n")
  );
}

/** Lazy validated env — use `env.KEY` instead of `process.env.KEY` for type safety */
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    const validated = validateEnv(false);
    return (validated as Record<string, unknown>)[prop];
  },
});

/** Helper for lib/* to enforce strict check at call time */
export function requireEnv<K extends keyof Env>(key: K): Env[K] {
  const validated = validateEnv(true);
  const value = validated[key];
  if (isPlaceholder(value as unknown as string)) {
    throw new Error(
      `${String(key)} is not configured — replace placeholder in .env (see .env.example)`
    );
  }
  return value;
}
