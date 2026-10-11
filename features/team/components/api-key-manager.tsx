import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PreviewBadge } from "@/components/preview-badge";

export function ApiKeyManager({ keys }: { keys: { id: string; name: string; masked: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>API Keys</CardTitle>
          <PreviewBadge />
        </div>
        <CardDescription>Manage programmatic access to your workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {keys.length === 0 ? <p className="text-sm text-muted-foreground">No keys yet.</p> : null}
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{k.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{k.masked}</p>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
        ))}
        <Button variant="outline" className="w-full" disabled>Generate New Key</Button>
      </CardContent>
    </Card>
  );
}
