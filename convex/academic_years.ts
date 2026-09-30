import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAcademicYears = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("academic_years").collect();
  },
});

export const createAcademicYear = mutation({
  args: {
    name: v.string(),
    start_date: v.string(),
    end_date: v.string(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("academic_years", args);
  },
});
