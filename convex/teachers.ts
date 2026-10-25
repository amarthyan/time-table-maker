import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTeachers = query({
  args: {
    department_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let teachers = await ctx.db.query("teachers").collect();
    if (args.department_id) {
      teachers = teachers.filter((t) => t.department_id === args.department_id);
    }
    const assignments = await ctx.db.query("assignments").collect();

    return teachers.map((teacher) => {
      const assignedCount = assignments.filter((a) => a.teacher_id === teacher._id).length;
      return {
        ...teacher,
        assignedCount,
      };
    });
  },
});

export const createTeacher = mutation({
  args: {
    department_id: v.string(),
    employee_id: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    status: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teachers", {
      department_id: args.department_id,
      employee_id: args.employee_id,
      name: args.name,
      email: args.email,
      phone: args.phone,
      status: args.status || "ACTIVE",
      color: args.color,
    });
  },
});

export const removeTeacher = mutation({
  args: {
    id: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .filter((q) => q.eq(q.field("teacher_id"), args.id))
      .collect();
    for (const a of assignments) {
      await ctx.db.delete(a._id);
    }
    await ctx.db.delete(args.id);
    return true;
  },
});
