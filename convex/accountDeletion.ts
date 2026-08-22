import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuthUserId } from "./authHelpers";
import { callSuiteBridge } from "./billing";

const USER_TABLES = [
  "socialAccounts",
  "activeAccounts",
  "settings",
  "profiles",
  "customLinks",
  "friendsFilters",
  "workspaceState",
  "entitlements",
  "subscriptions",
] as const;

async function collectByField(ctx: any, table: string, field: string, value: unknown) {
  return await ctx.db
    .query(table)
    .filter((q: any) => q.eq(q.field(field), value))
    .collect();
}

export const deleteLocalAccountData = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return { status: "already_deleted" as const };

    for (const table of USER_TABLES) {
      const rows = await collectByField(ctx, table, "userId", userId);
      for (const row of rows) await ctx.db.delete(row._id);
    }

    const redemptionCodes = await collectByField(ctx, "redemptionCodes", "redeemedBy", userId);
    for (const row of redemptionCodes) {
      await ctx.db.patch(row._id, { redeemedBy: undefined });
    }
    const billingEvents = await collectByField(ctx, "billingEvents", "userId", userId);
    for (const row of billingEvents) {
      await ctx.db.patch(row._id, { userId: undefined, payload: undefined });
    }

    const sessions = await collectByField(ctx, "authSessions", "userId", userId);
    const sessionIds = new Set(sessions.map((row: any) => String(row._id)));
    const refreshTokens = await ctx.db.query("authRefreshTokens").collect();
    for (const row of refreshTokens) {
      if (sessionIds.has(String((row as any).sessionId))) await ctx.db.delete(row._id);
    }
    const verifiers = await ctx.db.query("authVerifiers").collect();
    for (const row of verifiers) {
      if ((row as any).sessionId && sessionIds.has(String((row as any).sessionId))) {
        await ctx.db.delete(row._id);
      }
    }
    for (const row of sessions) await ctx.db.delete(row._id);

    const accounts = await collectByField(ctx, "authAccounts", "userId", userId);
    const accountIds = new Set(accounts.map((row: any) => String(row._id)));
    const verificationCodes = await ctx.db.query("authVerificationCodes").collect();
    for (const row of verificationCodes) {
      if ((row as any).accountId && accountIds.has(String((row as any).accountId))) {
        await ctx.db.delete(row._id);
      }
    }
    for (const row of accounts) await ctx.db.delete(row._id);
    await ctx.db.delete(userId);

    return { status: "deleted" as const };
  },
});

export const deleteMyAccount = action({
  args: { confirmation: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const user = await ctx.runQuery(internal.users.getDeletionIdentity, { userId });
    if (!user?.email) throw new Error("email_account_required");
    if (args.confirmation.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      throw new Error("account_deletion_confirmation_mismatch");
    }

    await callSuiteBridge({
      operation: "prepare_account_deletion",
      providerAccountId: userId,
      email: user.email,
    });

    return await ctx.runMutation(
      (internal as any).accountDeletion.deleteLocalAccountData,
      { userId },
    );
  },
});
