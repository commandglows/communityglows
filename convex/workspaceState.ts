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
      || (
        (parsed as { version?: unknown }).version !== 1
        && (parsed as { version?: unknown }).version !== 2
      )
      || !Array.isArray((parsed as { layouts?: unknown }).layouts)
      || (parsed as { layouts: unknown[] }).layouts.length > 120
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

export const setKanbanContacts = mutation({
  args: { kanbanContactsJson: v.string(), updatedAt: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    assertSerializedArray(args.kanbanContactsJson, "kanbanContactsJson");
    const contacts = JSON.parse(args.kanbanContactsJson) as unknown[];
    const ids = new Set<string>();
    for (const value of contacts) {
      const contact = value as Record<string, unknown> | null;
      if (!contact || typeof contact.id !== "string" || !contact.id || ids.has(contact.id)
        || typeof contact.name !== "string" || !contact.name.trim() || contact.name.length > 120
        || typeof contact.note !== "string" || contact.note.length > 4000
        || typeof contact.createdAt !== "string" || !Number.isFinite(Date.parse(contact.createdAt))
        || typeof contact.updatedAt !== "string" || !Number.isFinite(Date.parse(contact.updatedAt))) {
        throw new Error("kanbanContactsJson contains an invalid contact");
      }
      ids.add(contact.id);
      if (contact.url !== undefined) {
        if (typeof contact.url !== "string" || contact.url.length > 2048) throw new Error("Invalid contact URL");
        const url = new URL(contact.url);
        if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid contact URL");
      }
      if (contact.nextFollowUp !== undefined && (typeof contact.nextFollowUp !== "string"
        || !/^\d{4}-\d{2}-\d{2}$/.test(contact.nextFollowUp)
        || !Number.isFinite(Date.parse(contact.nextFollowUp))
        || new Date(contact.nextFollowUp).toISOString().slice(0, 10) !== contact.nextFollowUp)) {
        throw new Error("Invalid contact follow-up date");
      }
    }
    const existing = await ctx.db
      .query("workspaceState")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        kanbanContactsJson: args.kanbanContactsJson,
        updatedAt: args.updatedAt,
      });
      return;
    }
    await ctx.db.insert("workspaceState", {
      userId,
      kanbanContactsJson: args.kanbanContactsJson,
      updatedAt: args.updatedAt,
    });
  },
});
