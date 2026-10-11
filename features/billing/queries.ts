import type { SubscriptionStatus } from "@prisma/client";
import { db, withRetry } from "@/lib/db";
import { planForPrice } from "@/lib/stripe";
import type { PlanId } from "./schema";

/**
 * Statuses where the Stripe subscription still exists (it can still be billed or
 * managed in the Customer Portal). A user in one of these must not start a second checkout.
 */
export const LIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIALING", "PAST_DUE", "UNPAID"];

export interface SubscriptionSummary {
  /** True when the user has a subscription that still exists in Stripe. */
  hasLiveSubscription: boolean;
  /** Plan of the live subscription, or null if none / price not mapped to a plan. */
  currentPlanId: PlanId | null;
  status: SubscriptionStatus | null;
  currentPeriodEnd: Date | null;
  /** Stripe customer to reuse for checkout and the Customer Portal. */
  stripeCustomerId: string | null;
}

export async function getSubscriptionSummary(userId: string): Promise<SubscriptionSummary> {
  const rows = await withRetry(() =>
    db.subscription.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { status: true, stripePriceId: true, stripeCurrentPeriodEnd: true, stripeCustomerId: true },
    })
  );
  const live = rows.find((r) => LIVE_SUBSCRIPTION_STATUSES.includes(r.status));
  const latest = live ?? rows[0];
  return {
    hasLiveSubscription: Boolean(live),
    currentPlanId: live ? planForPrice(live.stripePriceId) : null,
    status: latest?.status ?? null,
    currentPeriodEnd: latest?.stripeCurrentPeriodEnd ?? null,
    stripeCustomerId: rows.find((r) => r.stripeCustomerId)?.stripeCustomerId ?? null,
  };
}
