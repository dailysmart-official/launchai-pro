"use client";

import * as React from "react";
import type { UsageStats } from "../actions";
import type { Range } from "../schema";

export function useUsage(range: Range = "7d") {
  const [data, setData] = React.useState<UsageStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/analytics/usage?range=${range}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load usage");
        const json = (await res.json()) as UsageStats;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled && (e as Error).name !== "AbortError") {
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [range]);

  return { data, loading, error };
}
