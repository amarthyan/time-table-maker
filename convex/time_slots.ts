import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getTimeSlots = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("time_slots").collect();
  },
});

export const createTimeSlot = mutation({
  args: {
    day: v.string(),
    period_number: v.number(),
    start_time: v.string(),
    end_time: v.string(),
    is_break: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("time_slots", args);
  },
});
