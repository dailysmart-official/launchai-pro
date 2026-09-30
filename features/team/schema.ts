import { z } from "zod";

export const RoleSchema = z.enum(["owner", "admin", "member"]);
export type Role = z.infer<typeof RoleSchema>;

export const InviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: RoleSchema.default("member"),
});

export const ApiKeyNameSchema = z.object({
  name: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9-_ ]+$/),
});
