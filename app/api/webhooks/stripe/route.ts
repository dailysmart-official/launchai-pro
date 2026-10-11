import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type { SubscriptionStatus } from "@prisma/client";

// Map Stripe's lower-case statuses to Prisma enum (UPPER_SNAKE)
const stripeStatusToPrisma: Record<string, SubscriptionStatus> = {
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE_EXPIRED",
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: "Missing signature/secret" }, { status: 400 });

  const rawBody = await req.text();
  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;
        if (userId) {
          await db.subscription.upsert({
            where: { stripeCustomerId: session.customer as string },
            create: {
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: priceId,
              status: "ACTIVE" as SubscriptionStatus,
            },
            update: {
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: priceId,
              status: "ACTIVE" as SubscriptionStatus,
            },
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: (stripeStatusToPrisma[sub.status] ?? "INCOMPLETE") as SubscriptionStatus,
            stripePriceId: sub.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        // Subscription ended: always downgrade to CANCELED, whatever status Stripe reports.
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const canceled = { status: "CANCELED" as SubscriptionStatus };
        const { count } = await db.subscription.updateMany({ where: { stripeSubscriptionId: sub.id }, data: canceled });
        // Fallback for rows saved without a subscription ID
        if (count === 0) {
          await db.subscription.updateMany({ where: { stripeCustomerId: customerId, stripeSubscriptionId: null }, data: canceled });
        }
        break;
      }
      default:
        break;
    }
  } catch {
    // Intentionally opaque — do not leak internal error details to webhook caller
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
