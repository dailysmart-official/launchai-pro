import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RangeSchema } from "@/features/analytics/schema";
import { getUsageStats } from "@/features/analytics/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!(session?.user as unknown as { id?: string } | undefined)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rangeRaw = req.nextUrl.searchParams.get("range") ?? "7d";
  const parsed = RangeSchema.safeParse(rangeRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  try {
    const stats = await getUsageStats(parsed.data);
    return NextResponse.json(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
