import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getSubjects = query({
  args: {
    semester_id: v.optional(v.string()),
    department_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let subjects = await ctx.db.query("subjects").collect();
    if (args.semester_id) {
      subjects = subjects.filter((s) => s.semester_id === args.semester_id);
    }
    if (args.department_id) {
      subjects = subjects.filter((s) => s.department_id === args.department_id);
    }
    return subjects;
  },
});

export const createSubject = mutation({
  args: {
    department_id: v.string(),
    semester_id: v.string(),
    subject_code: v.string(),
    subject_name: v.string(),
    subject_type: v.union(v.literal("THEORY"), v.literal("LAB")),
    weekly_hours: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subjects", {
      department_id: args.department_id,
      semester_id: args.semester_id,
      subject_code: args.subject_code,
      subject_name: args.subject_name,
      subject_type: args.subject_type,
      weekly_hours: args.weekly_hours,
    });
  },
});

export const removeSubject = mutation({
  args: {
    id: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .filter((q) => q.eq(q.field("subject_id"), args.id))
      .collect();
    for (const a of assignments) {
      await ctx.db.delete(a._id);
    }
    await ctx.db.delete(args.id);
    return true;
  },
});
