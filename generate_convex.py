import os

BASE_DIR = r"c:\Users\Rohith Roblelal\Desktop\projects\time-table-maker\convex"

FILES = {
    "schema.ts": """\
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    password_hash: v.string(),
    role: v.string(),
    is_active: v.boolean(),
  }).index("by_email", ["email"]),

  departments: defineTable({
    name: v.string(),
    code: v.string(),
  }).index("by_code", ["code"]),

  academic_years: defineTable({
    name: v.string(),
    start_date: v.string(),
    end_date: v.string(),
    is_active: v.boolean(),
  }),

  semesters: defineTable({
    academic_year_id: v.id("academic_years"),
    name: v.string(),
    semester_number: v.number(),
    semester_type: v.string(), // ODD, EVEN
  }),

  classes: defineTable({
    department_id: v.id("departments"),
    academic_year_id: v.id("academic_years"),
    semester_id: v.id("semesters"),
    year_number: v.number(),
    division: v.string(),
    name: v.string(),
    student_count: v.number(),
    is_active: v.boolean(),
  }),

  teachers: defineTable({
    department_id: v.id("departments"),
    employee_id: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    status: v.string(),
  }),

  subjects: defineTable({
    department_id: v.id("departments"),
    semester_id: v.id("semesters"),
    subject_code: v.string(),
    subject_name: v.string(),
    subject_type: v.string(),
    weekly_hours: v.number(),
  }),

  assignments: defineTable({
    teacher_id: v.id("teachers"),
    subject_id: v.id("subjects"),
    class_id: v.id("classes"),
    lab_assistant_1_id: v.optional(v.id("teachers")),
    lab_assistant_2_id: v.optional(v.id("teachers")),
  }),

  rooms: defineTable({
    department_id: v.id("departments"),
    name: v.string(),
    capacity: v.number(),
    building: v.optional(v.string()),
    floor: v.optional(v.string()),
    status: v.string(),
  }),

  labs: defineTable({
    department_id: v.id("departments"),
    name: v.string(),
    lab_type: v.string(),
    capacity: v.number(),
    status: v.string(),
  }),

  time_slots: defineTable({
    day: v.string(),
    period_number: v.number(),
    start_time: v.string(),
    end_time: v.string(),
    is_break: v.boolean(),
  }),

  timetables: defineTable({
    department_id: v.id("departments"),
    academic_year_id: v.id("academic_years"),
    semester_type: v.string(),
    version: v.number(),
    status: v.string(),
  }),

  timetable_entries: defineTable({
    timetable_id: v.id("timetables"),
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
  }).index("by_timetable_and_class", ["timetable_id", "class_id"])
    .index("by_timetable", ["timetable_id"])
});
""",

    "teachers.ts": """\
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
""",

    "timetables.ts": """\
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
""",
    
    "departments.ts": """\
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getDepartments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("departments").collect();
  },
});

export const createDepartment = mutation({
  args: {
    name: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("departments", args);
  },
});
""",
    
    "assignments.ts": """\
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    return await ctx.db.insert("assignments", args);
  },
});
""",
    "classes.ts": """\
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
""",
    "subjects.ts": """\
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    return await ctx.db.insert("subjects", args);
  },
});
""",
    "rooms.ts": """\
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getRooms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rooms").collect();
  },
});

export const createRoom = mutation({
  args: {
    department_id: v.id("departments"),
    name: v.string(),
    capacity: v.number(),
    building: v.optional(v.string()),
    floor: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rooms", args);
  },
});
""",
    "labs.ts": """\
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getLabs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("labs").collect();
  },
});

export const createLab = mutation({
  args: {
    department_id: v.id("departments"),
    name: v.string(),
    lab_type: v.string(),
    capacity: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("labs", args);
  },
});
""",
    "semesters.ts": """\
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSemesters = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("semesters").collect();
  },
});
"""
}

os.makedirs(BASE_DIR, exist_ok=True)
for path, content in FILES.items():
    full_path = os.path.join(BASE_DIR, path)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Generated Convex files successfully.")
