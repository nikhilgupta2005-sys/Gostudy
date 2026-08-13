import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, withPublic } from "@/lib/api";
import {
  verifyPassword,
  createSession,
  isRateLimited,
  recordFailedLogin,
  clearLoginAttempts,
  WINDOW_MINUTES,
} from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().trim().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const POST = withPublic(LoginSchema, async ({ email, password }, { req }) => {
  const normalised = email.toLowerCase();

  if (await isRateLimited(normalised)) {
    return fail(`Too many failed attempts. Try again in ${WINDOW_MINUTES} minutes.`, 429);
  }

  const user = await prisma.adminUser.findUnique({ where: { email: normalised } });

  // Same message either way so the form can't be used to discover valid emails
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordFailedLogin(normalised);
    return fail("Wrong email or password", 401);
  }

  await clearLoginAttempts(normalised);
  await createSession(user.id, req.headers.get("user-agent"));
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
