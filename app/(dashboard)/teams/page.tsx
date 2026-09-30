import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteForm } from "@/features/team/components/invite-form";
import { MemberList } from "@/features/team/components/member-list";
import { ApiKeyManager } from "@/features/team/components/api-key-manager";
import type { TeamMember } from "@/features/team/types";

export const metadata = { title: "Team - LaunchAI Pro" };
export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await auth();
  if (!(session?.user as unknown as { id?: string } | undefined)?.id) redirect("/login");

  const members: TeamMember[] = [
    {
      id: "owner-1",
      email: (session?.user?.email as string) ?? "owner@launchai.pro",
      role: "owner",
      status: "active",
      joinedAt: new Date().toISOString(),
    },
    {
      id: "demo-2",
      email: "teammate@launchai.pro",
      role: "member",
      status: "invited",
      joinedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const apiKeys = [
    { id: "k1", name: "Production", masked: "sk_live_****Prod" },
    { id: "k2", name: "Development", masked: "sk_test_****Deve" },
  ];

  return (
    <main className="py-8 px-4 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Workspace</h1>
        <p className="text-muted-foreground">Manage members and API access — Enterprise tier preview.</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[120px] w-full" />}>
        <InviteForm />
      </Suspense>

      <MemberList members={members} />

      <ApiKeyManager keys={apiKeys} />

      <p className="text-xs text-muted-foreground">
        Stateless v1.4.0 — invites &amp; keys mocked for marketplace preview. Persist with SHA-256 + Prisma in v1.4.1. API:{" "}
        <code className="rounded bg-muted px-1">POST /api/team/invite</code> ·{" "}
        <code className="rounded bg-muted px-1">POST /api/api-keys</code>
      </p>
    </main>
  );
}
