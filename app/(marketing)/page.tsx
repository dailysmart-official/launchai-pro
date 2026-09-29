import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2 font-bold">
          <Sparkles className="h-6 w-6 text-primary" /> LaunchAI Pro
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
          <Button asChild><Link href="/writer">Go to Writer</Link></Button>
        </div>
      </header>
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight">Ship marketing copy 10x faster with AI</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Generate blogs, ads, emails and landing pages that convert — all in one platform.</p>
        <Button size="lg" className="mt-8" asChild><Link href="/writer"><Sparkles className="mr-2 h-4 w-4" /> Start Writing</Link></Button>
      </section>
    </main>
  );
}
