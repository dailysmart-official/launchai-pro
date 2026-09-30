import { z } from "zod";

export const PlanIdSchema = z.enum(["starter", "pro", "enterprise"]);
export type PlanId = z.infer<typeof PlanIdSchema>;

export const CheckoutSchema = z.object({
  planId: PlanIdSchema,
  successUrl: z.string().url().optional(),
});

export const BillingIntervalSchema = z.enum(["month", "year"]);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;
