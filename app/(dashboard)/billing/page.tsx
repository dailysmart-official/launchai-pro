import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await auth();
  if (!(session?.user as { id?: string } | undefined)?.id) redirect("/login");

  // Envato Note: Dummy pricing template — no live charge without STRIPE_SECRET_KEY
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <Badge variant="secondary">Demo UI — Connect Stripe Keys to Activate</Badge>
        </div>
        <p className="text-muted-foreground">Manage your subscription and payment method.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Stripe integration — choose a plan to continue.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button variant="outline" disabled>
            Manage Billing (Stripe Checkout)
          </Button>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Route <code className="rounded bg-muted px-1 py-0.5">/billing</code> is now live — previously 404.
        Wire <code className="rounded bg-muted px-1 py-0.5">getStripeSession</code> from{" "}
        <code className="rounded bg-muted px-1 py-0.5">lib/stripe.ts</code> to enable checkout.
      </p>
    </div>
  );
}
