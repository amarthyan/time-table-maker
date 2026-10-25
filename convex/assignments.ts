import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAssignments = query({
  args: {
    class_id: v.optional(v.string()),
    teacher_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("assignments");
    if (args.class_id) {
      return await q.filter((rule) => rule.eq(rule.field("class_id"), args.class_id!)).collect();
    }
    if (args.teacher_id) {
      return await q.filter((rule) => rule.eq(rule.field("teacher_id"), args.teacher_id!)).collect();
    }
    return await q.collect();
  },
});

export const createAssignment = mutation({
  args: {
    teacher_id: v.string(),
    subject_id: v.string(),
    class_id: v.string(),
    lab_assistant_1_id: v.optional(v.string()),
    lab_assistant_2_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Business Logic Rule 1: Semester Alignment Verification
    const subject = await ctx.db
      .query("subjects")
      .filter((q) => q.eq(q.field("_id"), args.subject_id as any))
      .first();

    const targetClass = await ctx.db
      .query("classes")
      .filter((q) => q.eq(q.field("_id"), args.class_id as any))
      .first();

    if (subject && targetClass && subject.semester_id !== targetClass.semester_id) {
      throw new Error(
        `Semester misalignment: Subject ${subject.subject_code} belongs to a different semester than class ${targetClass.name}.`
      );
    }

    // 2. Business Logic Rule 2: Lab Assistant Uniqueness & Validity
    if (args.lab_assistant_1_id && args.lab_assistant_2_id) {
      if (args.lab_assistant_1_id === args.lab_assistant_2_id) {
        throw new Error("Lab assistant 1 and Lab assistant 2 cannot be the same teacher.");
      }
    }
    if (args.lab_assistant_1_id && args.lab_assistant_1_id === args.teacher_id) {
      throw new Error("Primary teacher cannot be assigned as their own lab assistant.");
    }

    // 3. Upsert assignment
    const existing = await ctx.db
      .query("assignments")
      .filter((q) =>
        q.and(
          q.eq(q.field("subject_id"), args.subject_id),
          q.eq(q.field("class_id"), args.class_id)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        teacher_id: args.teacher_id,
        lab_assistant_1_id: args.lab_assistant_1_id,
        lab_assistant_2_id: args.lab_assistant_2_id,
      });
      return existing._id;
    }

    return await ctx.db.insert("assignments", {
      teacher_id: args.teacher_id,
      subject_id: args.subject_id,
      class_id: args.class_id,
      lab_assistant_1_id: args.lab_assistant_1_id,
      lab_assistant_2_id: args.lab_assistant_2_id,
    });
  },
});

export const removeAssignment = mutation({
  args: {
    id: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});
