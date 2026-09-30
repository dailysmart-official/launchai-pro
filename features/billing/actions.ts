"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getStripeSession, STRIPE_PLANS } from "@/lib/stripe";
import { CheckoutSchema } from "./schema";

const ActionError = (message: string) => ({ success: false as const, error: message });

export async function createCheckoutAction(rawData: unknown) {
  try {
    const parsed = CheckoutSchema.safeParse(rawData);
    if (!parsed.success) {
      return ActionError("Invalid plan selection.");
    }

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("placeholder")) {
      if (process.env.NODE_ENV === "production") {
        return ActionError("Billing is not configured. Please contact support.");
      }
      const headersList = await headers();
      const origin = headersList.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      return { success: true as const, url: `${origin}/dashboard?checkout=success&plan=${parsed.data.planId}` };
    }

    const session = await auth();
    const user = session?.user as unknown as { id?: string; email?: string } | undefined;
    if (!user?.id || !user?.email) {
      return ActionError("Unauthorized — please sign in.");
    }

    const planId = parsed.data.planId;
    const priceMap: Record<string, string> = {
      starter: STRIPE_PLANS.starter,
      pro: STRIPE_PLANS.pro,
      enterprise: STRIPE_PLANS.pro,
    };
    const priceId = priceMap[planId];
    if (!priceId) {
      return ActionError("Selected plan is not available.");
    }

    const headersList = await headers();
    const origin = headersList.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const stripeSession = await getStripeSession(priceId, user.id, user.email);
    if (!stripeSession.url) {
      return ActionError("Unable to initiate checkout. Please try again.");
    }

    void origin;
    return { success: true as const, url: stripeSession.url };
  } catch (error) {
    console.error("[BILLING_CHECKOUT_ERROR]", error);
    return ActionError("Unable to initiate checkout. Please try again.");
  }
}
