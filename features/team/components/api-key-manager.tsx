import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ApiKeyManager({ keys }: { keys: { id: string; name: string; masked: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>Manage programmatic access — keys are SHA-256 hashed.</CardDescription>
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
        <Button variant="outline" className="w-full">Generate New Key</Button>
        <p className="text-xs text-muted-foreground">Keys are SHA256 hashed. Raw key shown once only.</p>
      </CardContent>
    </Card>
  );
}
