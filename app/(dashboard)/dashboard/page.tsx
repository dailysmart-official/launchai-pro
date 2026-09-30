import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CreditCard, Users } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCards } from "@/features/analytics/components/stat-cards";
import { UsageChart } from "@/features/analytics/components/usage-chart";
import { GenerationHistory, type HistoryItem } from "@/features/analytics/components/generation-history";
import { getUsageStats } from "@/features/analytics/actions";
import { db, withRetry } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!(session?.user as { id?: string } | undefined)?.id) redirect("/login");
  const userId = (session!.user as unknown as { id: string }).id;

  let stats: Awaited<ReturnType<typeof getUsageStats>> | null = null;
  try {
    stats = await getUsageStats("7d");
  } catch {
    stats = null;
  }

  let history: HistoryItem[] = [];
  try {
    const rows = await withRetry(() =>
      db.aIGeneration.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, title: true, type: true, tone: true, tokens: true, createdAt: true },
      })
    ).catch(() => []);
    history = rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      tone: r.tone,
      tokens: r.tokens,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    history = [];
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {session?.user?.name ?? session?.user?.email}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> AI Writer</CardTitle></CardHeader><CardContent><Button asChild><Link href="/writer">Open Writer</Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Billing</CardTitle></CardHeader><CardContent><Button variant="outline" asChild><Link href="/billing">Manage</Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Teams</CardTitle></CardHeader><CardContent><Button variant="outline" asChild><Link href="/teams">View Teams</Link></Button></CardContent></Card>
      </div>

      {stats ? (
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <StatCards
            totalGenerations={stats.totalGenerations}
            totalTokens={stats.totalTokens}
            creditsUsed={stats.creditsUsed}
            creditsTotal={stats.creditsTotal}
          />
        </Suspense>
      ) : (
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Analytics unavailable — start generating to populate stats.</p></CardContent></Card>
      )}

      {stats ? <UsageChart buckets={stats.dailyBuckets} /> : null}

      <GenerationHistory items={history} />

      <p className="text-xs text-muted-foreground">
        Analytics range defaults to 7d — query <code className="rounded bg-muted px-1">/api/analytics/usage?range=30d</code> for 30-day view. Team & API Keys deferred to v1.3.1.
      </p>
    </div>
  );
}
