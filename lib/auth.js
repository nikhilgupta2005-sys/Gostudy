import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE = "gostudy_session";
const SESSION_DAYS = 7;

/** Failed sign-ins allowed per email before the account is briefly locked. */
const MAX_ATTEMPTS = 8;
const WINDOW_MINUTES = 15;

export const hashPassword = (plain) => bcrypt.hash(plain, 12);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// The cookie holds the raw token; only its digest is stored, so a database
// dump can't be replayed as a live session.
const digest = (token) => crypto.createHash("sha256").update(token).digest("hex");

export async function createSession(userId, userAgent) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { id: digest(token), userId, expiresAt, userAgent: userAgent?.slice(0, 200) },
  });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

/** The signed-in admin, or null. Expired sessions are cleaned up on the way past. */
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: digest(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const { passwordHash, ...user } = session.user;
  return user;
}

export async function isAdmin() {
  return (await getCurrentUser()) !== null;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await prisma.session.delete({ where: { id: digest(token) } }).catch(() => {});
  }
  store.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Drops every session for a user — used after a password change. */
export async function revokeUserSessions(userId) {
  await prisma.session.deleteMany({ where: { userId } });
}

// ── Brute-force throttling ───────────────────────────────────

export async function isRateLimited(email) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const recent = await prisma.loginAttempt.count({
    where: { email: email.toLowerCase(), createdAt: { gte: since } },
  });
  return recent >= MAX_ATTEMPTS;
}

export async function recordFailedLogin(email) {
  await prisma.loginAttempt.create({ data: { email: email.toLowerCase() } });
}

export async function clearLoginAttempts(email) {
  await prisma.loginAttempt.deleteMany({ where: { email: email.toLowerCase() } });
}

export { WINDOW_MINUTES, MAX_ATTEMPTS };
