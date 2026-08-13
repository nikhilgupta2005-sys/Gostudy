import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDriver } from "@/lib/storage";
import { resolveMailDriver, mailerConfigured } from "@/lib/mailer";

export const dynamic = "force-dynamic";

/**
 * Deployment smoke test: hit /api/health after releasing to confirm the app can
 * actually reach its database and that uploads are pointed somewhere writable.
 * Returns 503 if either is misconfigured, so uptime checks catch it.
 */
export async function GET() {
  const url = process.env.DATABASE_URL || "";
  const report = {
    ok: true,
    env: process.env.NODE_ENV,
    database: { kind: url.startsWith("file:") || !url ? "local file" : "hosted (libSQL/Turso)" },
    storage: { driver: resolveDriver() },
    // Not having a mail provider is a valid choice, so this never fails the check
    mail: { driver: resolveMailDriver(), configured: mailerConfigured() },
  };

  try {
    const [products, categories, admins] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.adminUser.count(),
    ]);
    report.database.reachable = true;
    report.database.counts = { products, categories, admins };
    if (admins === 0) {
      report.ok = false;
      report.database.warning = "No admin user exists — run the seed before signing in";
    }
  } catch (err) {
    report.ok = false;
    report.database.reachable = false;
    report.database.error = err.message;
  }

  // Uploads silently failing in production is worse than a loud check here
  if (process.env.VERCEL && report.storage.driver === "local") {
    report.ok = false;
    report.storage.error = "Vercel's filesystem is read-only — configure Blob or Cloudinary";
  }

  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
