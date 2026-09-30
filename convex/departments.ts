import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getDepartments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("departments").collect();
  },
});

export const createDepartment = mutation({
  args: {
    name: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("departments", args);
  },
});
