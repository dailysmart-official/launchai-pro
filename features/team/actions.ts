"use server";

import { InviteSchema, ApiKeyNameSchema } from "./schema";

const ActionError = (message: string) => ({ success: false as const, error: message });

export async function inviteMemberAction(rawData: unknown) {
  try {
    const parsed = InviteSchema.safeParse(rawData);
    if (!parsed.success) return ActionError("Invalid invitation data.");

    // const session = await auth(); if(!session?.user?.id) return ActionError("Unauthorized");
    // await db.teamInvite.create({ data: { ...parsed.data, invitedBy: session.user.id } });

    return { success: true as const, data: parsed.data };
  } catch (error) {
    console.error("[TEAM_INVITE_ERROR]", error);
    return ActionError("Unable to send invite. Please try again.");
  }
}

export async function createApiKeyAction(rawData: unknown) {
  try {
    const parsed = ApiKeyNameSchema.safeParse(rawData);
    if (!parsed.success) return ActionError("Invalid key name.");

    // const key = `sk_live_${crypto.randomUUID().replace(/-/g,"")}`;
    // const hashedKey = createHash("sha256").update(key).digest("hex");
    // await db.apiKey.create({ data: { name: parsed.data.name, hash: hashedKey } });
    // return { success: true, key }; // Show once only

    return { success: true as const, maskedKey: `sk_live_****${parsed.data.name.slice(0, 4)}` };
  } catch (error) {
    console.error("[API_KEY_ERROR]", error);
    return ActionError("Unable to create API key.");
  }
}

export async function revokeApiKeyAction(id: string) {
  try {
    if (!id || typeof id !== "string") return ActionError("Invalid key id.");
    // await db.apiKey.delete({ where: { id } });
    return { success: true as const };
  } catch (error) {
    console.error("[API_KEY_REVOKE_ERROR]", error);
    return ActionError("Unable to revoke key.");
  }
}
