import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface HistoryItem {
  id: string;
  title: string | null;
  type: string;
  tone: string;
  tokens: number | null;
  createdAt: string;
}

export function GenerationHistory({ items }: { items: HistoryItem[] }) {
  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generation History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No generations yet — start writing to see history.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium truncate">{it.title ?? it.type}</p>
              <p className="text-xs text-muted-foreground">{new Date(it.createdAt).toLocaleString()} · {it.tokens ?? 0} tokens</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Badge variant="secondary">{it.type}</Badge>
              <Badge variant="outline">{it.tone}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
