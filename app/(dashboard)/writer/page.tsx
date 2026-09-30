import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, withRetry } from "@/lib/db";
import AIWriterForm from "@/modules/ai-writer/components/ai-writer-form";
import GenerationHistory from "@/modules/ai-writer/components/generation-history";

export const dynamic = "force-dynamic";

export default async function WriterPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const generations = await withRetry(() =>
    db.aIGeneration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
  ).catch((e) => {
    console.error("[WriterPage] DB unreachable after retries:", e);
    return [] as Awaited<ReturnType<typeof db.aIGeneration.findMany>>;
  });

  const serialized = generations.map((g) => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Writer</h1>
        <p className="text-muted-foreground">Generate high-converting copy in seconds.</p>
      </div>
      <AIWriterForm />
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Generations</h2>
        <GenerationHistory initial={serialized} />
      </div>
    </div>
  );
}
