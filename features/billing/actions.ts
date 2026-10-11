"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, getStripeSession, getPlanPrices, isStripeConfigured } from "@/lib/stripe";
import { CheckoutSchema } from "./schema";

const ActionError = (message: string) => ({ success: false as const, error: message });

export async function createCheckoutAction(rawData: unknown) {
  try {
    const parsed = CheckoutSchema.safeParse(rawData);
    if (!parsed.success) {
      return ActionError("Invalid plan selection.");
    }

    if (!isStripeConfigured()) {
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
      return ActionError("Please sign in to choose a plan.");
    }

    const planId = parsed.data.planId;
    // Each plan uses only its own price — never fall back to another plan's price.
    const priceId = getPlanPrices()[planId];
    if (!priceId) {
      return ActionError(
        planId === "enterprise"
          ? "Enterprise is available on request — please contact sales."
          : "This plan is not available right now."
      );
    }

    const stripeSession = await getStripeSession(priceId, user.id, user.email);
    if (!stripeSession.url) {
      return ActionError("Unable to initiate checkout. Please try again.");
    }

    return { success: true as const, url: stripeSession.url };
  } catch (error) {
    console.error("[BILLING_CHECKOUT_ERROR]", error);
    return ActionError("Unable to initiate checkout. Please try again.");
  }
}

export async function createPortalAction() {
  try {
    if (!isStripeConfigured()) {
      return ActionError("Billing is not configured. Please contact support.");
    }

    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return ActionError("Please sign in to manage billing.");
    }

    const subscription = await db.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { stripeCustomerId: true },
    });
    if (!subscription?.stripeCustomerId) {
      return ActionError("No billing account found yet. Choose a plan first.");
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/billing`,
    });
    return { success: true as const, url: portal.url };
  } catch (error) {
    console.error("[BILLING_PORTAL_ERROR]", error);
    return ActionError("Unable to open the billing portal. Please try again.");
  }
}
