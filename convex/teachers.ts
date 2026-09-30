import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getTeachers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teachers").collect();
  },
});

export const createTeacher = mutation({
  args: {
    department_id: v.id("departments"),
    employee_id: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teachers", args);
  },
});
