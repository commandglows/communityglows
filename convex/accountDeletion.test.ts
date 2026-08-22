import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("account deletion", () => {
  it("deletes user cloud data and anonymizes records that must remain", async () => {
    const t = convexTest(schema, modules);
    const seeded = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", { email: "person@example.com" });
      const socialAccountId = await ctx.db.insert("socialAccounts", {
        userId,
        accountId: "social-1",
        networkId: "linkedin",
        label: "Work",
        addedAt: 1,
      });
      const redemptionCodeId = await ctx.db.insert("redemptionCodes", {
        code: "LTD-DELETE",
        productId: "communityglows",
        planId: "lifetime_deal",
        source: "manual",
        status: "redeemed",
        createdAt: 1,
        updatedAt: 1,
        redeemedAt: 1,
        redeemedBy: userId,
      });
      const billingEventId = await ctx.db.insert("billingEvents", {
        userId,
        productId: "communityglows",
        source: "manual",
        eventType: "grant",
        payload: { email: "person@example.com" },
        createdAt: 1,
      });
      return { userId, socialAccountId, redemptionCodeId, billingEventId };
    });

    const result = await t.mutation(
      (internal as any).accountDeletion.deleteLocalAccountData,
      { userId: seeded.userId },
    );

    expect(result).toEqual({ status: "deleted" });
    await t.run(async (ctx) => {
      expect(await ctx.db.get(seeded.userId)).toBeNull();
      expect(await ctx.db.get(seeded.socialAccountId)).toBeNull();
      expect(await ctx.db.get(seeded.redemptionCodeId)).toMatchObject({
        redeemedBy: undefined,
      });
      expect(await ctx.db.get(seeded.billingEventId)).toMatchObject({
        userId: undefined,
        payload: undefined,
      });
    });
  });

  it("is idempotent after the account is already gone", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) =>
      ctx.db.insert("users", { email: "gone@example.com" }),
    );
    await t.run((ctx) => ctx.db.delete(userId));

    await expect(
      t.mutation((internal as any).accountDeletion.deleteLocalAccountData, { userId }),
    ).resolves.toEqual({ status: "already_deleted" });
  });
});
