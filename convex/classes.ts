import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getClasses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("classes").collect();
  },
});

export const createClass = mutation({
  args: {
    department_id: v.id("departments"),
    academic_year_id: v.id("academic_years"),
    semester_id: v.id("semesters"),
    year_number: v.number(),
    division: v.string(),
    name: v.string(),
    student_count: v.number(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("classes", args);
  },
});
