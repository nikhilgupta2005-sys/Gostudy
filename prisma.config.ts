import { defineConfig } from "prisma/config";

// Prisma 7 keeps the connection URL out of schema.prisma. Migrate/introspect read
// it from here; the runtime client gets it via the libSQL adapter in lib/prisma.js.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./data/gostudy.db",
  },
  migrations: {
    seed: "node prisma/seed.mjs",
  },
});
