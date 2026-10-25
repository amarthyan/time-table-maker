import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("labs").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    capacity: v.number(),
    duration: v.number(),
    assistantCount: v.number(),
    active: v.boolean(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("labs", {
      name: args.name,
      capacity: args.capacity,
      duration: args.duration,
      assistantCount: args.assistantCount,
      active: args.active,
      location: args.location,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("labs"),
    name: v.optional(v.string()),
    capacity: v.optional(v.number()),
    duration: v.optional(v.number()),
    assistantCount: v.optional(v.number()),
    active: v.optional(v.boolean()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return true;
  },
});

export const remove = mutation({
  args: {
    id: v.id("labs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});
