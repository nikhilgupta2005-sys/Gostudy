import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const ok = (data = { ok: true }) => NextResponse.json(data);
export const fail = (error, status = 400) => NextResponse.json({ error }, { status });

/**
 * Wraps a route handler so it only runs for a signed-in admin, validates the
 * JSON body against a zod schema, and turns thrown errors into clean 4xx/5xx.
 *
 *   export const POST = withAdmin(CreateSchema, async (body, { user }) => ok(...));
 *
 * Pass `{ role: "owner" }` to restrict a route to owner accounts.
 */
export function withAdmin(schema, handler, opts = {}) {
  return async (req, ctx) => {
    const user = await getCurrentUser();
    if (!user) return fail("Please sign in again", 401);
    if (opts.role && user.role !== opts.role) {
      return fail("Only an owner account can do this", 403);
    }

    let body = null;
    if (schema) {
      let raw;
      try {
        raw = await req.json();
      } catch {
        return fail("Invalid JSON body");
      }
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        return fail(
          first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input"
        );
      }
      body = parsed.data;
    }

    try {
      return await handler(body, { user, req, ctx });
    } catch (err) {
      // Unique-constraint and missing-row violations are user error, not bugs
      if (err?.code === "P2002") return fail("That name is already taken", 409);
      if (err?.code === "P2025") return fail("Not found", 404);
      console.error("[api]", err);
      return fail("Something went wrong on the server", 500);
    }
  };
}

/** Same error handling for public routes (no auth). */
export function withPublic(schema, handler) {
  return async (req, ctx) => {
    let body = null;
    if (schema) {
      let raw;
      try {
        raw = await req.json();
      } catch {
        return fail("Invalid JSON body");
      }
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        return fail(
          first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input"
        );
      }
      body = parsed.data;
    }
    try {
      return await handler(body, { req, ctx });
    } catch (err) {
      console.error("[api]", err);
      return fail("Something went wrong on the server", 500);
    }
  };
}
