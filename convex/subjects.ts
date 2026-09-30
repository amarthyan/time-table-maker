import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";

export const getSubjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subjects").collect();
  },
});

export const createSubject = mutation({
  args: {
    department_id: v.id("departments"),
    semester_id: v.id("semesters"),
    subject_code: v.string(),
    subject_name: v.string(),
    subject_type: v.string(),
    weekly_hours: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("subjects", args);
  },
});
