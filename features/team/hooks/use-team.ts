"use client";

import { useEffect, useState } from "react";
import type { TeamMember } from "../types";

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function fetchTeam() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/team/members", { signal: controller.signal });
        if (!res.ok) throw new Error("Fetch failed");
        const data = (await res.json()) as TeamMember[];
        if (!cancelled) setMembers(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError" && !cancelled) {
          setError((err as Error).message);
          console.error("[USE_TEAM_ERROR]", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchTeam();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return { members, loading, error };
}
