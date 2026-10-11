import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteForm } from "@/features/team/components/invite-form";
import { MemberList } from "@/features/team/components/member-list";
import { ApiKeyManager } from "@/features/team/components/api-key-manager";
import { PreviewBadge } from "@/components/preview-badge";
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

  // Preview: nothing is stored yet, so no keys are shown.
  const apiKeys: { id: string; name: string; masked: string }[] = [];

  return (
    <main className="py-8 px-4 max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">Team Workspace</h1>
          <PreviewBadge />
        </div>
        <p className="text-muted-foreground">Manage members and API access.</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[120px] w-full" />}>
        <InviteForm />
      </Suspense>

      <MemberList members={members} />

      <ApiKeyManager keys={apiKeys} />
    </main>
  );
}
