"use client";

import * as React from "react";
import type { SubscriptionState } from "../types";

export function useSubscription() {
  const [data, setData] = React.useState<SubscriptionState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/billing/subscription", { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load subscription");
        const json = (await res.json()) as SubscriptionState;
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
  }, []);

  return { data, loading, error };
}
