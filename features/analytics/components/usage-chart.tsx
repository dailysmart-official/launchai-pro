"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function UsageChart({ buckets }: { buckets: { date: string; count: number; tokens: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage (7/30 days)</CardTitle>
        <CardDescription>Daily generations — per-user scoped</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32" aria-label="Usage chart">
          {buckets.map((b) => (
            <div key={b.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary rounded-t transition-all"
                style={{ height: `${(b.count / max) * 100}%`, minHeight: b.count ? 4 : 1 }}
                title={`${b.date}: ${b.count} generations, ${b.tokens} tokens`}
              />
              <span className="text-[9px] text-muted-foreground truncate">{b.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
