import { Suspense } from "react";
import { PricingTable } from "@/features/billing/components/pricing-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getBillingConfig } from "@/lib/stripe";

export const metadata = {
  title: "Pricing - LaunchAI Pro | Simple, Transparent Plans",
  description: "Choose the perfect plan for your AI workflow. No hidden fees.",
};

// Read Stripe env vars at request time, not at build time.
export const dynamic = "force-dynamic";

export default function PricingPage() {
  return (
    <main className="py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Simple pricing for teams of all sizes</h1>
        <p className="text-muted-foreground mt-3">Start free, scale as you grow. Cancel anytime.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-[400px] w-full max-w-6xl mx-auto" />}>
        <PricingTable config={getBillingConfig()} />
      </Suspense>
    </main>
  );
}
