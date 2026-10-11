import Stripe from "stripe";
import type { PlanId } from "@/features/billing/schema";

/** True when a real STRIPE_SECRET_KEY is set (server-side check, read at request time). */
export function isStripeConfigured(): boolean {
  const v = process.env.STRIPE_SECRET_KEY?.trim();
  return Boolean(v) && !v!.includes("placeholder");
}

// Defer validation to runtime — allows `next build` with placeholder .env
function getStripeSecret(): string {
  if (!isStripeConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("STRIPE_SECRET_KEY is not configured — set sk_... in .env (see .env.example)");
    }
    return "sk_test_placeholder";
  }
  return process.env.STRIPE_SECRET_KEY!.trim();
}

let _stripe: Stripe | null = null;
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      _stripe = new Stripe(getStripeSecret(), {
        apiVersion: "2024-06-20",
        typescript: true,
      });
    }
    return (_stripe as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export async function getStripeSession(priceId: string, userId: string, email: string) {
  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: { userId, priceId },
    success_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/billing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/billing?canceled=true`,
  });
}

/** Stripe price ID per plan, read at request time. Empty string = plan not purchasable. */
export function getPlanPrices(): Record<PlanId, string> {
  return {
    starter: process.env.STRIPE_PRICE_STARTER?.trim() ?? "",
    pro: process.env.STRIPE_PRICE_PRO?.trim() ?? "",
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE?.trim() ?? "",
  };
}

/** Plan whose price ID matches, or null. */
export function planForPrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  const prices = getPlanPrices();
  return (Object.keys(prices) as PlanId[]).find((p) => prices[p] === priceId) ?? null;
}

/** Optional link for the Enterprise "Contact sales" button. Only https:// or mailto: is accepted. */
export function getSalesContactUrl(): string | null {
  const v = process.env.SALES_CONTACT_URL?.trim();
  if (!v) return null;
  return /^(https:\/\/|mailto:)/i.test(v) ? v : null;
}

/** What the pricing UI needs to know — safe to pass to client components (no secrets). */
export interface BillingConfig {
  enabled: boolean;
  purchasable: Record<PlanId, boolean>;
  salesContactUrl: string | null;
}

export function getBillingConfig(): BillingConfig {
  const enabled = isStripeConfigured();
  const prices = getPlanPrices();
  return {
    enabled,
    purchasable: {
      starter: enabled && Boolean(prices.starter),
      pro: enabled && Boolean(prices.pro),
      enterprise: enabled && Boolean(prices.enterprise),
    },
    salesContactUrl: getSalesContactUrl(),
  };
}
