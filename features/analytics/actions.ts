"use server";

import { auth } from "@/lib/auth";
import { db, withRetry } from "@/lib/db";
import { RangeSchema, type Range } from "./schema";

export interface UsageStats {
  totalGenerations: number;
  totalTokens: number;
  dailyBuckets: { date: string; count: number; tokens: number }[];
  creditsUsed: number;
  creditsTotal: number;
}

function getDateFloor(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days + 1);
  return d;
}

export async function getUsageStats(range: Range = "7d"): Promise<UsageStats> {
  try {
    const parsed = RangeSchema.safeParse(range);
    if (!parsed.success) throw new Error("Invalid range");
    const cleanRange = parsed.data;

    const session = await auth();
    const userId = (session?.user as unknown as { id?: string } | undefined)?.id;
    if (!userId) throw new Error("Unauthorized");

    const days = cleanRange === "7d" ? 7 : 30;
    const since = getDateFloor(days);

    const [generations, totalCount] = await Promise.all([
      withRetry(() =>
        db.aIGeneration.findMany({
          where: { userId, createdAt: { gte: since } },
          select: { createdAt: true, tokens: true },
          orderBy: { createdAt: "asc" },
        })
      ).catch(() => [] as { createdAt: Date; tokens: number | null }[]),
      withRetry(() => db.aIGeneration.count({ where: { userId } })).catch(() => 0),
    ]);

    const bucketMap = new Map<string, { count: number; tokens: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      if (key) bucketMap.set(key, { count: 0, tokens: 0 });
    }

    let totalTokens = 0;
    for (const g of generations) {
      const key = g.createdAt.toISOString().slice(0, 10);
      if (!key) continue;
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.count += 1;
        bucket.tokens += g.tokens ?? 0;
      }
      totalTokens += g.tokens ?? 0;
    }

    const dailyBuckets = Array.from(bucketMap.entries()).map(([date, v]) => ({
      date,
      count: v.count,
      tokens: v.tokens,
    }));

    return {
      totalGenerations: totalCount,
      totalTokens,
      dailyBuckets,
      creditsUsed: totalTokens,
      creditsTotal: 50000,
    };
  } catch (error) {
    console.error("[ANALYTICS_ERROR]", error);
    throw new Error("Unable to load usage stats. Please try again.");
  }
}
