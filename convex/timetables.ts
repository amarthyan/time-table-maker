import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";

export const getTimetables = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("timetables").collect();
  },
});

// Class-wise timetable retrieval
export const getClassTimetable = query({
  args: {
    timetable_id: v.id("timetables"),
    class_id: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timetable_entries")
      .withIndex("by_timetable_and_class", (q) =>
        q.eq("timetable_id", args.timetable_id).eq("class_id", args.class_id)
      )
      .collect();
      
    // Optionally resolve references (teachers, subjects, rooms) here
    return entries;
  },
});

// Year-wise timetable retrieval (requires fetching all classes for the given year first)
export const getYearTimetable = query({
  args: {
    timetable_id: v.id("timetables"),
    academic_year_id: v.id("academic_years"),
    year_number: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all classes in this year
    const classes = await ctx.db
      .query("classes")
      .filter((q) => 
        q.and(
          q.eq(q.field("academic_year_id"), args.academic_year_id),
          q.eq(q.field("year_number"), args.year_number)
        )
      )
      .collect();
      
    const classIds = classes.map(c => c._id);
    
    // Fetch all entries for this timetable
    const allEntries = await ctx.db
      .query("timetable_entries")
      .withIndex("by_timetable", (q) => q.eq("timetable_id", args.timetable_id))
      .collect();
      
    // Filter to only those matching our class IDs
    const yearEntries = allEntries.filter(e => classIds.includes(e.class_id));
    
    return {
      classes,
      entries: yearEntries
    };
  },
});


export const publishGeneratedTimetable = mutation({
  args: {
    department_id: v.id("departments"),
    academic_year_id: v.id("academic_years"),
    semester_type: v.string(),
    entries: v.array(v.object({
      class_id: v.id("classes"),
      subject_id: v.id("subjects"),
      teacher_id: v.id("teachers"),
      lab_assistant_1_id: v.optional(v.id("teachers")),
      lab_assistant_2_id: v.optional(v.id("teachers")),
      room_id: v.optional(v.id("rooms")),
      lab_id: v.optional(v.id("labs")),
      day: v.string(),
      period: v.number(),
      duration: v.number(),
      entry_type: v.string(),
    }))
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // 1. Create timetable
    const ttId = await ctx.db.insert("timetables", {
      department_id: args.department_id,
      academic_year_id: args.academic_year_id,
      semester_type: args.semester_type,
      version: 1,
      status: "GENERATED"
    });
    
    // 2. Insert all entries
    for (const entry of args.entries) {
      await ctx.db.insert("timetable_entries", {
        timetable_id: ttId,
        ...entry
      });
    }
    
    return ttId;
  }
});
