/**
 * Minimal in-memory sliding-window rate limiter — zero external dependencies.
 * Per-instance (suitable for single-instance / serverless with short keep-alive;
 * for multi-instance scale, replace with Upstash/Redis implementation).
 *
 * Limits are applied per userId (authenticated) or IP (unauthenticated).
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic cleanup (avoid unbounded memory growth) — runs every 5 min
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (cleanupTimer || typeof setInterval === "undefined") return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) {
      if (now > b.resetAt) buckets.delete(k);
    }
    // Node.js: don't keep process alive just for this timer
    if (cleanupTimer && typeof (cleanupTimer as unknown as { unref?: () => void }).unref === "function") {
      (cleanupTimer as unknown as { unref: () => void }).unref?.();
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Max requests in window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check and consume one request token for `key`.
 * Returns `{ success:false }` when limit exceeded.
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + config.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, limit: config.limit, remaining: config.limit - 1, resetAt };
  }

  if (bucket.count >= config.limit) {
    return { success: false, limit: config.limit, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/** Presets — default limits per route group */
export const RATE_LIMITS = {
  /** AI generation — expensive (OpenAI cost) → strict */
  aiGenerate: { limit: 10, windowMs: 60_000 } as RateLimitConfig, // 10/min per user
  /** Reads — generous */
  aiRead: { limit: 60, windowMs: 60_000 } as RateLimitConfig, // 60/min
  /** Workspace mutations — hardened (spec: 20/min sliding window) */
  workspaceWrite: { limit: 20, windowMs: 60_000 } as RateLimitConfig, // 20/min
} as const;

/** Derive limiter key from authenticated userId or IP */
export function getRateLimitKey(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "anonymous";
  return `ip:${ip}`;
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

/** For testing — reset state */
export function _resetRateLimitState() {
  buckets.clear();
}
