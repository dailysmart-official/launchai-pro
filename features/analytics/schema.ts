import { z } from "zod";

export const RangeSchema = z.enum(["7d", "30d"]);
export type Range = z.infer<typeof RangeSchema>;

export const UsageQuerySchema = z.object({
  range: RangeSchema.default("7d"),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
