import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    is_active: v.boolean(),
  }).index("by_token", ["tokenIdentifier"]),

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
