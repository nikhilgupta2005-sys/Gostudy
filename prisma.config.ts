import { defineConfig } from "prisma/config";

// Prisma 7 keeps the connection URL out of schema.prisma. Migrate/introspect read
// it from here; the runtime client gets it via the libSQL adapter in lib/prisma.js.

// `??` would let an empty string through, and Prisma then fails with the opaque
// "Connection url is empty" — so treat blank exactly like unset.
const configured = process.env.DATABASE_URL?.trim();

if (!configured && process.env.VERCEL) {
  throw new Error(
    "DATABASE_URL is missing on Vercel.\n\n" +
      "The build runs `prisma migrate deploy`, which needs a database to migrate.\n" +
      "Add these in Vercel → Settings → Environment Variables, then redeploy:\n" +
      "  DATABASE_URL         libsql://<your-db>.turso.io\n" +
      "  DATABASE_AUTH_TOKEN  <token from `turso db tokens create`>\n\n" +
      "Make sure they are enabled for the environment you are deploying " +
      "(Production, Preview, or both)."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: configured || "file:./data/gostudy.db",
  },
  migrations: {
    seed: "node prisma/seed.mjs",
  },
});
