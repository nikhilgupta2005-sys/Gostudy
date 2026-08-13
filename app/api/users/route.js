import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, withAdmin } from "@/lib/api";
import { hashPassword, revokeUserSessions } from "@/lib/auth";
import { getAdminUsers } from "@/lib/queries";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters");

export const GET = withAdmin(null, async () => ok({ users: await getAdminUsers() }));

export const POST = withAdmin(
  z.object({
    name: z.string().trim().min(1, "Name is required"),
    email,
    password,
    role: z.enum(["owner", "admin"]).default("admin"),
  }),
  async (data) => {
    const existing = await prisma.adminUser.findUnique({ where: { email: data.email } });
    if (existing) return fail("An account with that email already exists", 409);

    const user = await prisma.adminUser.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: await hashPassword(data.password),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
    });
    return ok(user);
  },
  { role: "owner" }
);

export const PUT = withAdmin(
  z.object({
    id: z.number().int(),
    name: z.string().trim().min(1).optional(),
    email: email.optional(),
    role: z.enum(["owner", "admin"]).optional(),
    password: password.optional(),
  }),
  async (data, { user: actor }) => {
    const target = await prisma.adminUser.findUnique({ where: { id: data.id } });
    if (!target) return fail("User not found", 404);

    const editingSelf = actor.id === target.id;
    if (!editingSelf && actor.role !== "owner") {
      return fail("Only an owner account can edit other users", 403);
    }
    if (data.role && actor.role !== "owner") {
      return fail("Only an owner account can change roles", 403);
    }
    // Don't let the last owner demote themselves and lock everyone out
    if (data.role === "admin" && target.role === "owner") {
      const owners = await prisma.adminUser.count({ where: { role: "owner" } });
      if (owners <= 1) return fail("There must be at least one owner account", 400);
    }

    const patch = {};
    if (data.name) patch.name = data.name;
    if (data.role) patch.role = data.role;
    if (data.email && data.email !== target.email) {
      const clash = await prisma.adminUser.findUnique({ where: { email: data.email } });
      if (clash) return fail("An account with that email already exists", 409);
      patch.email = data.email;
    }
    if (data.password) patch.passwordHash = await hashPassword(data.password);

    const updated = await prisma.adminUser.update({
      where: { id: data.id },
      data: patch,
      select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
    });

    // A new password should end every other signed-in session for that user
    if (data.password) await revokeUserSessions(data.id);

    return ok(updated);
  }
);

export const DELETE = withAdmin(
  z.object({ id: z.number().int() }),
  async ({ id }, { user: actor }) => {
    if (actor.id === id) return fail("You can't delete the account you're signed in with", 400);

    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (!target) return fail("User not found", 404);

    if (target.role === "owner") {
      const owners = await prisma.adminUser.count({ where: { role: "owner" } });
      if (owners <= 1) return fail("There must be at least one owner account", 400);
    }

    await prisma.adminUser.delete({ where: { id } });
    return ok();
  },
  { role: "owner" }
);
