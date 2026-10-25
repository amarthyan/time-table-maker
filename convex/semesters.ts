import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getActive = query({
  handler: async (ctx) => {
    const sem = await ctx.db
      .query("semesters")
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!sem) {
      return {
        academicYear: "2026–27",
        type: "ODD" as const,
        isActive: true,
      };
    }
    return sem;
  },
});

export const update = mutation({
  args: {
    academicYear: v.string(),
    type: v.union(v.literal("ODD"), v.literal("EVEN")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("semesters")
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        academicYear: args.academicYear,
        type: args.type,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("semesters", {
        academicYear: args.academicYear,
        type: args.type,
        isActive: true,
      });
    }
  },
});
