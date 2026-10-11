import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBillingConfig } from "@/lib/stripe";
import { getSubscriptionSummary } from "@/features/billing/queries";
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

  const summary = await getSubscriptionSummary(userId).catch((e) => {
    console.error("[BillingPage] DB unreachable after retries:", e);
    return null;
  });
  const subscribed = Boolean(summary?.hasLiveSubscription);
  const planName = subscribed ? summary?.currentPlanId ?? "Paid plan" : "Free";

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
            {subscribed
              ? `${summary?.currentPeriodEnd ? `Renews ${summary.currentPeriodEnd.toLocaleDateString()}. ` : ""}Change or cancel your plan via Manage billing.`
              : "Choose a plan below to upgrade."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold capitalize">{planName}</span>
            {summary?.status && (
              <Badge variant={subscribed ? "default" : "secondary"}>{summary.status.toLowerCase().replace("_", " ")}</Badge>
            )}
          </div>
          {config.enabled && summary?.stripeCustomerId && <ManageBillingButton />}
        </CardContent>
      </Card>

      <PricingTable config={config} subscription={summary} />
    </div>
  );
}
