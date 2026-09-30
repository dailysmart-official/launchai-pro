"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createCheckoutAction } from "../actions";
import type { Plan } from "../types";

const PLANS: Plan[] = [
  { id: "starter", name: "Starter", price: { month: 19, year: 190 }, credits: 5000, features: ["5,000 AI Credits", "3 Workspaces", "Standard Support"], cta: "Start Free Trial" },
  { id: "pro", name: "Pro", price: { month: 49, year: 490 }, credits: 50000, features: ["50,000 AI Credits", "Unlimited Workspaces", "Priority Support", "API Access"], cta: "Get Pro", popular: true },
  { id: "enterprise", name: "Enterprise", price: { month: 99, year: 990 }, credits: 200000, features: ["200,000 AI Credits", "SSO & SAML", "Dedicated Manager", "Custom Models"], cta: "Contact Sales" },
];

export function PricingTable({ interval = "month" }: { interval?: "month" | "year" }) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleCheckout = async (planId: Plan["id"]) => {
    try {
      setLoadingId(planId);
      const result = await createCheckoutAction({ planId });
      if (result.success && result.url) {
        window.location.href = result.url;
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
      {PLANS.map((plan) => (
        <Card key={plan.id} className={cn("flex flex-col relative", plan.popular && "border-primary shadow-lg scale-[1.02]")}>
          {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>}
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
            <Button
              onClick={() => handleCheckout(plan.id)}
              disabled={!!loadingId}
              variant={plan.popular ? "default" : "outline"}
              className="w-full"
            >
              {loadingId === plan.id ? "Processing..." : plan.cta}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
