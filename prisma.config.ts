import { defineConfig } from "prisma/config";

// Prisma 7 keeps the connection URL out of schema.prisma. Migrate/introspect read
// it from here; the runtime client gets it via the libSQL adapter in lib/prisma.js.
//
// This file must not throw: it is loaded by every Prisma command, including
// `generate`, which does not need a database at all. Deployment configuration is
// checked by scripts/check-deploy-env.mjs at the start of `vercel-build`.

// `??` would let an empty string through, and Prisma then fails with the opaque
// "Connection url is empty" — so treat blank exactly like unset.
const configured = process.env.DATABASE_URL?.trim();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: configured || "file:./data/gostudy.db",
  },
  migrations: {
    seed: "node prisma/seed.mjs",
  },
});
