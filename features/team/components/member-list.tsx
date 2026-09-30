import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TeamMember } from "../types";

export function MemberList({ members }: { members: TeamMember[] }) {
  if (!members.length) {
    return (
      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No members yet — invite your first teammate.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Members ({members.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-md border p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{m.email}</p>
              <p className="text-xs text-muted-foreground">{new Date(m.joinedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
              <Badge variant="outline">{m.status}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
