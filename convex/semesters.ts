import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSemesters = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("semesters").collect();
  },
});

export const createSemester = mutation({
  args: {
    academic_year_id: v.id("academic_years"),
    name: v.string(),
    semester_number: v.number(),
    semester_type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("semesters", args);
  },
});
