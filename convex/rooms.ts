import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getRooms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rooms").collect();
  },
});

export const createRoom = mutation({
  args: {
    department_id: v.id("departments"),
    name: v.string(),
    capacity: v.number(),
    building: v.optional(v.string()),
    floor: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rooms", args);
  },
});
