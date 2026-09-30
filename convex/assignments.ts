import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";

export const getAssignments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assignments").collect();
  },
});

export const createAssignment = mutation({
  args: {
    teacher_id: v.id("teachers"),
    subject_id: v.id("subjects"),
    class_id: v.id("classes"),
    lab_assistant_1_id: v.optional(v.id("teachers")),
    lab_assistant_2_id: v.optional(v.id("teachers")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const teacher = await ctx.db.get(args.teacher_id);
    if (!teacher) throw new Error("Teacher not found");
    
    const subject = await ctx.db.get(args.subject_id);
    if (!subject) throw new Error("Subject not found");
    
    const cls = await ctx.db.get(args.class_id);
    if (!cls) throw new Error("Class not found");
    
    // Validation: A subject must belong to the appropriate semester
    if (subject.semester_id !== cls.semester_id) {
        throw new Error("Subject semester does not match class semester");
    }
    
    // Lab rules
    if (subject.subject_type === "LAB") {
        const assistants = [args.lab_assistant_1_id, args.lab_assistant_2_id].filter(a => a !== undefined) as string[];
        if (assistants.includes(args.teacher_id)) {
            throw new Error("Main teacher cannot also be a lab assistant");
        }
        if (assistants.length === 2 && assistants[0] === assistants[1]) {
            throw new Error("Lab assistants must be unique");
        }
        
        for (const ast_id of assistants) {
            const ast = await ctx.db.get(ast_id as any);
            if (!ast) {
                throw new Error(`Lab assistant ${ast_id} not found`);
            }
        }
    } else {
        if (args.lab_assistant_1_id || args.lab_assistant_2_id) {
            throw new Error("Non-lab subjects cannot have lab assistants");
        }
    }
    
    // Duplicate prevention
    const existing = await ctx.db.query("assignments")
        .filter(q => q.and(
            q.eq(q.field("teacher_id"), args.teacher_id),
            q.eq(q.field("subject_id"), args.subject_id),
            q.eq(q.field("class_id"), args.class_id)
        ))
        .first();
        
    if (existing) {
        throw new Error("This assignment already exists");
    }

    return await ctx.db.insert("assignments", args);
  },
});
