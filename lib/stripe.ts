import Stripe from "stripe";

// Defer validation to runtime — allows `next build` with placeholder .env
// Real check happens in getStripeSession / webhook handler via requireEnv
function getStripeSecret(): string {
  const v = process.env.STRIPE_SECRET_KEY;
  if (!v || v.includes("placeholder")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("STRIPE_SECRET_KEY is not configured — set sk_... in .env (see .env.example)");
    }
    return "sk_test_placeholder";
  }
  return v;
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

export const STRIPE_PLANS = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
} as const;
