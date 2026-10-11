import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db, withRetry } from "@/lib/db";
import { getBillingConfig, planForPrice } from "@/lib/stripe";
import { PricingTable } from "@/features/billing/components/pricing-table";
import { ManageBillingButton } from "@/features/billing/components/manage-billing-button";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const params = await searchParams;
  const config = getBillingConfig();

  const subscription = await withRetry(() =>
    db.subscription.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { status: true, stripePriceId: true, stripeCurrentPeriodEnd: true, stripeCustomerId: true },
    })
  ).catch((e) => {
    console.error("[BillingPage] DB unreachable after retries:", e);
    return null;
  });
  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
  const planName = isActive ? planForPrice(subscription?.stripePriceId) ?? "Paid plan" : "Free";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          {!config.enabled && <Badge variant="secondary">Demo UI — Connect Stripe Keys to Activate</Badge>}
        </div>
        <p className="text-muted-foreground">Manage your subscription and payment method.</p>
      </div>

      {params.success && (
        <p role="status" className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900">
          Payment received. Your plan updates as soon as Stripe confirms the subscription.
        </p>
      )}
      {params.canceled && (
        <p role="status" className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
          Checkout canceled — you have not been charged.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            {subscription?.stripeCurrentPeriodEnd && isActive
              ? `Renews ${subscription.stripeCurrentPeriodEnd.toLocaleDateString()}`
              : "Choose a plan below to upgrade."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold capitalize">{planName}</span>
            {subscription && (
              <Badge variant={isActive ? "default" : "secondary"}>{subscription.status.toLowerCase().replace("_", " ")}</Badge>
            )}
          </div>
          {config.enabled && subscription?.stripeCustomerId && <ManageBillingButton />}
        </CardContent>
      </Card>

      <PricingTable config={config} />
    </div>
  );
}
