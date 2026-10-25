import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getClasses = query({
  args: {
    year_number: v.optional(v.number()),
    semester_id: v.optional(v.string()),
    academic_year_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("classes");
    let classes = await q.collect();

    if (args.year_number !== undefined) {
      classes = classes.filter((c) => c.year_number === args.year_number);
    }
    if (args.semester_id !== undefined) {
      classes = classes.filter((c) => c.semester_id === args.semester_id);
    }
    if (args.academic_year_id !== undefined) {
      classes = classes.filter((c) => c.academic_year_id === args.academic_year_id);
    }

    return classes;
  },
});

export const createClass = mutation({
  args: {
    department_id: v.string(),
    academic_year_id: v.string(),
    semester_id: v.string(),
    year_number: v.number(),
    division: v.string(),
    name: v.string(),
    student_count: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("classes", {
      department_id: args.department_id,
      academic_year_id: args.academic_year_id,
      semester_id: args.semester_id,
      year_number: args.year_number,
      division: args.division,
      name: args.name,
      student_count: args.student_count,
      is_active: true,
    });
  },
});

export const removeClass = mutation({
  args: {
    id: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .filter((q) => q.eq(q.field("class_id"), args.id))
      .collect();
    for (const a of assignments) {
      await ctx.db.delete(a._id);
    }

    const entries = await ctx.db
      .query("timetable_entries")
      .filter((q) => q.eq(q.field("class_id"), args.id))
      .collect();
    for (const e of entries) {
      await ctx.db.delete(e._id);
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
