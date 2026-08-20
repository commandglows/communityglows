import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./authHelpers";

const MAX_STATE_BYTES = 500_000;

function assertSerializedArray(value: string, field: string) {
  if (value.length > MAX_STATE_BYTES) {
    throw new Error(`${field} is too large`);
  }
  try {
    if (!Array.isArray(JSON.parse(value))) {
      throw new Error(`${field} must contain an array`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes(field)) throw error;
    throw Object.assign(new Error(`${field} must contain valid JSON`), { cause: error });
  }
}

function assertDesktopWorkspaces(value: string) {
  if (value.length > MAX_STATE_BYTES) {
    throw new Error("desktopWorkspacesJson is too large");
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !parsed
      || typeof parsed !== "object"
      || Array.isArray(parsed)
      || (parsed as { version?: unknown }).version !== 1
      || !Array.isArray((parsed as { layouts?: unknown }).layouts)
      || (parsed as { layouts: unknown[] }).layouts.length > 12
    ) {
      throw new Error("desktopWorkspacesJson must contain a workspace state");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("desktopWorkspacesJson")) throw error;
    throw Object.assign(new Error("desktopWorkspacesJson must contain valid JSON"), { cause: error });
  }
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
    return await ctx.db
      .query("workspaceState")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const setContextualTasks = mutation({
  args: { contextualTasksJson: v.string(), updatedAt: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    assertSerializedArray(args.contextualTasksJson, "contextualTasksJson");
    const existing = await ctx.db
      .query("workspaceState")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        contextualTasksJson: args.contextualTasksJson,
        updatedAt: args.updatedAt,
      });
      return;
    }
    await ctx.db.insert("workspaceState", {
      userId,
      contextualTasksJson: args.contextualTasksJson,
      updatedAt: args.updatedAt,
    });
  },
});

export const setKanbanState = mutation({
  args: { kanbanStateJson: v.string(), updatedAt: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    assertSerializedArray(args.kanbanStateJson, "kanbanStateJson");
    const existing = await ctx.db
      .query("workspaceState")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        kanbanStateJson: args.kanbanStateJson,
        updatedAt: args.updatedAt,
      });
      return;
    }
    await ctx.db.insert("workspaceState", {
      userId,
      kanbanStateJson: args.kanbanStateJson,
      updatedAt: args.updatedAt,
    });
  },
});

export const setDesktopWorkspaces = mutation({
  args: { desktopWorkspacesJson: v.string(), updatedAt: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    assertDesktopWorkspaces(args.desktopWorkspacesJson);
    const existing = await ctx.db
      .query("workspaceState")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        desktopWorkspacesJson: args.desktopWorkspacesJson,
        updatedAt: args.updatedAt,
      });
      return;
    }
    await ctx.db.insert("workspaceState", {
      userId,
      desktopWorkspacesJson: args.desktopWorkspacesJson,
      updatedAt: args.updatedAt,
    });
  },
});
