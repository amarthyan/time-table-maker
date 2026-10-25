import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users - Used strictly for Admin mapping. Teachers do NOT have accounts.
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    is_active: v.boolean(),
  }).index("by_token", ["tokenIdentifier"]),

  // Departments
  departments: defineTable({
    name: v.string(), // e.g. "Computer Science & Engineering"
    code: v.string(), // e.g. "CSE"
  }).index("by_code", ["code"]),

  // Academic Years
  academic_years: defineTable({
    name: v.string(), // e.g. "2026–27"
    start_date: v.string(), // ISO date string
    end_date: v.string(),
    is_active: v.boolean(),
  }),

  // Semesters
  semesters: defineTable({
    academic_year_id: v.string(),
    name: v.string(), // e.g. "Semester 1", "Semester 3"
    semester_number: v.number(), // 1 to 8
    semester_type: v.union(v.literal("ODD"), v.literal("EVEN")),
  })
    .index("by_academic_year", ["academic_year_id"])
    .index("by_type", ["semester_type"]),

  // Classes / Sections
  classes: defineTable({
    department_id: v.string(),
    academic_year_id: v.string(),
    semester_id: v.string(),
    year_number: v.number(), // 1, 2, 3, 4
    division: v.string(), // e.g. "A", "B"
    name: v.string(), // e.g. "CSE A (1st Yr)"
    student_count: v.number(),
    is_active: v.boolean(),
  })
    .index("by_year_number", ["year_number"])
    .index("by_semester", ["semester_id"]),

  // Teachers
  teachers: defineTable({
    department_id: v.string(),
    employee_id: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    status: v.string(), // "ACTIVE" | "INACTIVE"
    color: v.optional(v.string()),
  }).index("by_employee_id", ["employee_id"]),

  // Subjects
  subjects: defineTable({
    department_id: v.string(),
    semester_id: v.string(),
    subject_code: v.string(), // e.g. "MAT101"
    subject_name: v.string(), // e.g. "Linear Algebra & Calculus"
    subject_type: v.union(v.literal("THEORY"), v.literal("LAB")),
    weekly_hours: v.number(),
  })
    .index("by_code", ["subject_code"])
    .index("by_semester", ["semester_id"]),

  // Teaching Assignments
  assignments: defineTable({
    teacher_id: v.string(),
    subject_id: v.string(),
    class_id: v.string(),
    lab_assistant_1_id: v.optional(v.string()),
    lab_assistant_2_id: v.optional(v.string()),
  })
    .index("by_teacher", ["teacher_id"])
    .index("by_class", ["class_id"])
    .index("by_subject", ["subject_id"]),

  // Rooms
  rooms: defineTable({
    department_id: v.string(),
    name: v.string(), // e.g. "Room 101"
    capacity: v.number(),
    building: v.string(),
    floor: v.number(),
    status: v.string(), // "ACTIVE" | "MAINTENANCE"
  }),

  // Labs
  labs: defineTable({
    department_id: v.string(),
    name: v.string(), // e.g. "Computing Systems Lab"
    lab_type: v.string(), // "COMPUTER" | "PHYSICS" | "ELECTRONICS"
    capacity: v.number(),
    status: v.string(), // "ACTIVE" | "MAINTENANCE"
  }),

  // Time Slots
  time_slots: defineTable({
    day: v.number(), // 1 to 6 (Monday to Saturday)
    period_number: v.number(), // 1 to 6
    start_time: v.string(), // "09:00"
    end_time: v.string(), // "10:00"
    is_break: v.boolean(),
  }),

  // Timetables
  timetables: defineTable({
    department_id: v.string(),
    academic_year_id: v.string(),
    semester_type: v.union(v.literal("ODD"), v.literal("EVEN")),
    version: v.number(),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("GENERATED"),
      v.literal("REVIEWED"),
      v.literal("PUBLISHED")
    ),
  })
    .index("by_year_and_type", ["academic_year_id", "semester_type"]),

  // Timetable Entries
  timetable_entries: defineTable({
    timetable_id: v.string(),
    class_id: v.string(),
    subject_id: v.string(),
    teacher_id: v.string(),
    lab_assistant_1_id: v.optional(v.string()),
    lab_assistant_2_id: v.optional(v.string()),
    room_id: v.optional(v.string()),
    lab_id: v.optional(v.string()),
    day: v.number(), // 1 to 6
    period: v.number(), // 1 to 6
    duration: v.number(), // 1 for theory, 2 for continuous lab
    entry_type: v.union(v.literal("THEORY"), v.literal("LAB")),
  })
    .index("by_timetable", ["timetable_id"])
    .index("by_timetable_and_class", ["timetable_id", "class_id"])
    .index("by_teacher_slot", ["teacher_id", "day", "period"])
    .index("by_lab_slot", ["lab_id", "day", "period"]),
});
