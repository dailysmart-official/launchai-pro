"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGE_OPTIONS, WRITER_TONE_OPTIONS, WRITER_TYPE_OPTIONS } from "../config";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";

type GenerateResponse = { id: string; result: string; title?: string | null };

export default function AIWriterForm({ aiConfigured = true }: { aiConfigured?: boolean }) {
  const [prompt, setPrompt] = React.useState("");
  const [tone, setTone] = React.useState("professional");
  const [type, setType] = React.useState("blog-post");
  const [language, setLanguage] = React.useState("English");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<GenerateResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone, type, language }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) throw new Error("AI generation needs an API key. See README.");
      if (!res.ok) throw new Error(data.error ?? "Generation failed. Please try again.");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.title ? `${result.title}\n\n${result.result}` : result.result);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Writer</CardTitle>
          <CardDescription>Describe what you want to generate. Choose tone, type and language.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Brief / Prompt</Label>
              <Textarea id="prompt" placeholder="e.g. Write a blog post about 5 AI tools every founder should use..." value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} required minLength={10} />
              <p className="text-xs text-muted-foreground">{prompt.length}/4000</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WRITER_TYPE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WRITER_TONE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            {!aiConfigured && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">AI generation needs an API key. See README.</p>}
            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || !aiConfigured || prompt.length < 10} className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div><CardTitle>Result</CardTitle><CardDescription>Your generated content will appear here</CardDescription></div>
          {result && <Button variant="outline" size="sm" onClick={handleCopy}>{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Copied" : "Copy"}</Button>}
        </CardHeader>
        <CardContent className="flex-1">
          {!result && !loading && <div className="flex h-full min-h-[280px] items-center justify-center rounded-md border border-dashed p-6 text-sm text-muted-foreground">No content yet. Fill the form and hit Generate.</div>}
          {loading && <div className="flex h-full min-h-[280px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {result && <div className="space-y-3">{result.title && <h3 className="text-lg font-semibold">{result.title}</h3>}<div className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{result.result}</div></div>}
        </CardContent>
      </Card>
    </div>
  );
}
