import type { PlanId, BillingInterval } from "./schema";

export interface Plan {
  id: PlanId;
  name: string;
  price: { month: number; year: number };
  credits: number;
  features: string[];
  cta: string;
  popular?: boolean;
}

export interface SubscriptionState {
  planId: PlanId;
  status: "active" | "canceled" | "past_due" | "trialing";
  creditsUsed: number;
  creditsTotal: number;
  currentPeriodEnd: string;
}

export type { BillingInterval };
