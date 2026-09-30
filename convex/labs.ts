import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getLabs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("labs").collect();
  },
});

export const createLab = mutation({
  args: {
    department_id: v.id("departments"),
    name: v.string(),
    lab_type: v.string(),
    capacity: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("labs", args);
  },
});
