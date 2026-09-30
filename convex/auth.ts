import { query, mutation, MutationCtx, QueryCtx } from "./_generated/server";

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated call. Admin access required.");
  }
  return identity;
}

export const getIdentity = query({
  args: {},
  handler: async (ctx) => {
    return await requireAdmin(ctx);
  },
});
