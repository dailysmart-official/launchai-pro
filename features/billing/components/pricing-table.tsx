"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createCheckoutAction } from "../actions";
import type { Plan } from "../types";
import type { PlanId } from "../schema";
import type { BillingConfig } from "@/lib/stripe";

const PLANS: Plan[] = [
  { id: "starter", name: "Starter", price: { month: 19, year: 190 }, credits: 5000, features: ["5,000 AI Credits", "3 Workspaces", "Standard Support"], cta: "Get Starter" },
  { id: "pro", name: "Pro", price: { month: 49, year: 490 }, credits: 50000, features: ["50,000 AI Credits", "Unlimited Workspaces", "Priority Support", "API Access"], cta: "Get Pro", popular: true },
  { id: "enterprise", name: "Enterprise", price: { month: 99, year: 990 }, credits: 200000, features: ["200,000 AI Credits", "SSO & SAML", "Dedicated Manager", "Custom Models"], cta: "Get Enterprise" },
];

/** The signed-in user's subscription, if any. Omit for visitors. */
export interface PricingSubscription {
  hasLiveSubscription: boolean;
  currentPlanId: PlanId | null;
}

export function PricingTable({
  interval = "month",
  config,
  subscription,
}: {
  interval?: "month" | "year";
  config: BillingConfig;
  subscription?: PricingSubscription | null;
}) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleCheckout = async (planId: Plan["id"]) => {
    setError(null);
    setLoadingId(planId);
    try {
      const result = await createCheckoutAction({ planId });
      if (result.success && result.url) {
        window.location.href = result.url;
        return;
      }
      setError(result.success ? "Unable to initiate checkout. Please try again." : result.error);
    } catch {
      setError("Unable to initiate checkout. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  function renderAction(plan: Plan) {
    const variant = plan.popular ? "default" : "outline";
    // Subscribed: no second checkout. The current plan is labelled; other plans change via the portal.
    if (subscription?.hasLiveSubscription) {
      return plan.id === subscription.currentPlanId ? (
        <p className="rounded-md border border-primary/40 bg-primary/5 py-2 text-center text-sm font-medium">Current plan</p>
      ) : (
        <Button disabled variant="outline" className="w-full">
          Change plan via Manage billing
        </Button>
      );
    }
    // Billing not configured: let the server action answer (dev mock / production message).
    if (!config.enabled || config.purchasable[plan.id]) {
      return (
        <Button onClick={() => handleCheckout(plan.id)} disabled={!!loadingId} variant={variant} className="w-full">
          {loadingId === plan.id ? "Processing..." : plan.cta}
        </Button>
      );
    }
    if (plan.id === "enterprise") {
      return config.salesContactUrl ? (
        <Button asChild variant={variant} className="w-full">
          <a href={config.salesContactUrl} rel="noopener noreferrer">Contact sales</a>
        </Button>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Available on request</p>
      );
    }
    return (
      <Button disabled variant={variant} className="w-full">
        Not available
      </Button>
    );
  }

  const isCurrent = (plan: Plan) => Boolean(subscription?.hasLiveSubscription && subscription.currentPlanId === plan.id);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "flex flex-col relative",
              (isCurrent(plan) || (!subscription?.hasLiveSubscription && plan.popular)) && "border-primary shadow-lg scale-[1.02]"
            )}
          >
            {isCurrent(plan) ? (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Your plan</Badge>
            ) : (
              plan.popular && !subscription?.hasLiveSubscription && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">${plan.price[interval]}</span>
                <span className="text-muted-foreground">/{interval}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {renderAction(plan)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
