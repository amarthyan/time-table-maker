import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to resolve timetable_id (or fallback to latest)
async function resolveTimetableId(ctx: any, timetable_id?: string): Promise<string | null> {
  if (timetable_id && timetable_id !== "latest") {
    return timetable_id;
  }
  const latest = await ctx.db.query("timetables").order("desc").first();
  return latest ? latest._id : null;
}

// Notable custom query 1: getClassTimetable(timetable_id, class_id)
export const getClassTimetable = query({
  args: {
    timetable_id: v.string(),
    class_id: v.string(),
  },
  handler: async (ctx, args) => {
    const targetTimetableId = await resolveTimetableId(ctx, args.timetable_id);
    if (!targetTimetableId) {
      return { class: null, entries: [] };
    }

    // 1. Fetch entries for this timetable and class
    const entries = await ctx.db
      .query("timetable_entries")
      .filter((q) =>
        q.and(
          q.eq(q.field("timetable_id"), targetTimetableId),
          q.eq(q.field("class_id"), args.class_id)
        )
      )
      .collect();

    // 2. Hydrate related entities
    const subjects = await ctx.db.query("subjects").collect();
    const teachers = await ctx.db.query("teachers").collect();
    const rooms = await ctx.db.query("rooms").collect();
    const labs = await ctx.db.query("labs").collect();
    const targetClass = await ctx.db
      .query("classes")
      .filter((q) => q.eq(q.field("_id"), args.class_id as any))
      .first();

    const subjectMap = new Map(subjects.map((s) => [s._id, s]));
    const teacherMap = new Map(teachers.map((t) => [t._id, t]));
    const roomMap = new Map(rooms.map((r) => [r._id, r]));
    const labMap = new Map(labs.map((l) => [l._id, l]));

    const hydratedEntries = entries.map((entry) => {
      const subject = subjectMap.get(entry.subject_id as any);
      const teacher = teacherMap.get(entry.teacher_id as any);
      const room = entry.room_id ? roomMap.get(entry.room_id as any) : undefined;
      const lab = entry.lab_id ? labMap.get(entry.lab_id as any) : undefined;
      const assistant1 = entry.lab_assistant_1_id ? teacherMap.get(entry.lab_assistant_1_id as any) : undefined;
      const assistant2 = entry.lab_assistant_2_id ? teacherMap.get(entry.lab_assistant_2_id as any) : undefined;

      return {
        ...entry,
        subject,
        teacher,
        room,
        lab,
        assistant1,
        assistant2,
      };
    });

    return {
      class: targetClass,
      entries: hydratedEntries,
    };
  },
});

// Notable custom query 2: getYearTimetable(timetable_id, academic_year_id, year_number)
export const getYearTimetable = query({
  args: {
    timetable_id: v.string(),
    academic_year_id: v.string(),
    year_number: v.number(),
  },
  handler: async (ctx, args) => {
    const targetTimetableId = await resolveTimetableId(ctx, args.timetable_id);
    if (!targetTimetableId) {
      return { year_number: args.year_number, classes: [], entries: [] };
    }

    // 1. Fetch classes in this academic year and year_number (1, 2, 3, or 4)
    const yearClasses = await ctx.db
      .query("classes")
      .filter((q) =>
        q.and(
          q.eq(q.field("academic_year_id"), args.academic_year_id),
          q.eq(q.field("year_number"), args.year_number),
          q.eq(q.field("is_active"), true)
        )
      )
      .collect();

    const classIds = new Set(yearClasses.map((c) => c._id));

    // 2. Fetch all entries for this timetable
    const allEntries = await ctx.db
      .query("timetable_entries")
      .filter((q) => q.eq(q.field("timetable_id"), targetTimetableId))
      .collect();

    const filteredEntries = allEntries.filter((e) => classIds.has(e.class_id as any));

    // 3. Hydrate
    const subjects = await ctx.db.query("subjects").collect();
    const teachers = await ctx.db.query("teachers").collect();
    const rooms = await ctx.db.query("rooms").collect();
    const labs = await ctx.db.query("labs").collect();

    const subjectMap = new Map(subjects.map((s) => [s._id, s]));
    const teacherMap = new Map(teachers.map((t) => [t._id, t]));
    const roomMap = new Map(rooms.map((r) => [r._id, r]));
    const labMap = new Map(labs.map((l) => [l._id, l]));

    const hydratedEntries = filteredEntries.map((e) => ({
      ...e,
      subject: subjectMap.get(e.subject_id as any),
      teacher: teacherMap.get(e.teacher_id as any),
      room: e.room_id ? roomMap.get(e.room_id as any) : undefined,
      lab: e.lab_id ? labMap.get(e.lab_id as any) : undefined,
    }));

    return {
      year_number: args.year_number,
      classes: yearClasses,
      entries: hydratedEntries,
    };
  },
});

// Fetch active timetable record
export const getLatestTimetable = query({
  args: {
    academic_year_id: v.optional(v.string()),
    semester_type: v.optional(v.union(v.literal("ODD"), v.literal("EVEN"))),
  },
  handler: async (ctx, args) => {
    let tQuery = ctx.db.query("timetables");
    if (args.academic_year_id && args.semester_type) {
      return await tQuery
        .filter((q) =>
          q.and(
            q.eq(q.field("academic_year_id"), args.academic_year_id!),
            q.eq(q.field("semester_type"), args.semester_type!)
          )
        )
        .first();
    }
    return await tQuery.order("desc").first();
  },
});

// Publish Generated Timetable (Used by FastAPI CP-SAT Microservice)
export const publishGeneratedTimetable = mutation({
  args: {
    department_id: v.optional(v.string()),
    academic_year_id: v.string(),
    semester_type: v.union(v.literal("ODD"), v.literal("EVEN")),
    entries: v.array(
      v.object({
        class_id: v.string(),
        subject_id: v.string(),
        teacher_id: v.string(),
        lab_assistant_1_id: v.optional(v.string()),
        lab_assistant_2_id: v.optional(v.string()),
        room_id: v.optional(v.string()),
        lab_id: v.optional(v.string()),
        day: v.number(),
        period: v.number(),
        duration: v.number(),
        entry_type: v.union(v.literal("THEORY"), v.literal("LAB")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("timetables")
      .filter((q) =>
        q.and(
          q.eq(q.field("academic_year_id"), args.academic_year_id),
          q.eq(q.field("semester_type"), args.semester_type)
        )
      )
      .first();

    let timetable_id: string;

    if (existing) {
      timetable_id = existing._id;
      await ctx.db.patch(existing._id, {
        version: (existing.version || 1) + 1,
        status: "GENERATED",
      });

      // Remove obsolete entries for this timetable
      const oldEntries = await ctx.db
        .query("timetable_entries")
        .filter((q) => q.eq(q.field("timetable_id"), timetable_id))
        .collect();

      for (const entry of oldEntries) {
        await ctx.db.delete(entry._id);
      }
    } else {
      timetable_id = await ctx.db.insert("timetables", {
        department_id: args.department_id || "dept_cse",
        academic_year_id: args.academic_year_id,
        semester_type: args.semester_type,
        version: 1,
        status: "GENERATED",
      });
    }

    // Insert newly generated solution entries
    for (const entry of args.entries) {
      await ctx.db.insert("timetable_entries", {
        timetable_id,
        ...entry,
      });
    }

    return {
      status: "success",
      timetable_id,
      entries_count: args.entries.length,
    };
  },
});

// Update single entry
export const updateTimetableEntry = mutation({
  args: {
    id: v.id("timetable_entries"),
    subject_id: v.optional(v.string()),
    teacher_id: v.optional(v.string()),
    room_id: v.optional(v.string()),
    lab_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return true;
  },
});

// Update publish status
export const setPublishStatus = mutation({
  args: {
    timetable_id: v.id("timetables"),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("GENERATED"),
      v.literal("REVIEWED"),
      v.literal("PUBLISHED")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.timetable_id, { status: args.status });
    return true;
  },
});
