"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export type GenerationItem = {
  id: string;
  prompt: string;
  result: string;
  title?: string | null;
  type: string;
  tone: string;
  language: string;
  createdAt: string;
};

export default function GenerationHistory({ initial }: { initial: GenerationItem[] }) {
  const [items, setItems] = React.useState(initial);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/ai/generate/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((x) => x.id !== id));
  }

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No generations yet.</p>;
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-base">{item.title ?? item.prompt.slice(0, 80)}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary">{item.type}</Badge>
              <Badge variant="outline">{item.tone}</Badge>
              <Badge variant="outline">{item.language}</Badge>
              <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground line-clamp-6">{item.result}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
