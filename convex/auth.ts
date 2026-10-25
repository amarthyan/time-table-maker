import { query } from "./_generated/server";

/**
 * Convex Identity Verification endpoint
 * Called by FastAPI microservice or client to authenticate user session
 */
export const getIdentity = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Lookup user in users table to check admin status
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    const isAdmin = user ? Boolean(user.is_active) : true; // Fallback to true if initial setup

    return {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      name: identity.name,
      isAdmin,
      user,
    };
  },
});
