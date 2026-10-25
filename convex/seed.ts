import { mutation } from "./_generated/server";

export const clearAllData = mutation({
  handler: async (ctx) => {
    const tables = [
      "users",
      "departments",
      "academic_years",
      "semesters",
      "classes",
      "teachers",
      "subjects",
      "assignments",
      "rooms",
      "labs",
      "time_slots",
      "timetables",
      "timetable_entries",
    ] as const;

    for (const t of tables) {
      const records = await ctx.db.query(t).collect();
      for (const r of records) {
        await ctx.db.delete(r._id);
      }
    }

    return {
      status: "success",
      message: "All database records have been purged. Clean slate initialized.",
    };
  },
});
