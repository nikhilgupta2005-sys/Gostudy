/**
 * Fails a deployment early, with an explanation, when required configuration is
 * missing — instead of letting it surface later as an opaque Prisma or runtime
 * error. Runs as the first step of `vercel-build`.
 */
const required = [
  {
    name: "DATABASE_URL",
    hint: "libsql://<your-db>.turso.io — from `turso db show <db> --url`",
  },
  {
    name: "DATABASE_AUTH_TOKEN",
    hint: "from `turso db tokens create <db>` — Turso rejects the connection without it",
  },
];

const missing = required.filter(({ name }) => !process.env[name]?.trim());

if (missing.length) {
  console.error(
    [
      "",
      "  Deployment is missing required environment variables:",
      "",
      ...missing.map(({ name, hint }) => `    ${name}\n      ${hint}`),
      "",
      "  Add them in Vercel → Settings → Environment Variables, tick the",
      "  environment you are deploying (Production and/or Preview), then redeploy.",
      "",
    ].join("\n")
  );
  process.exit(1);
}

if (process.env.DATABASE_URL.startsWith("file:")) {
  console.error(
    "\n  DATABASE_URL points at a local file. A serverless filesystem is discarded\n" +
      "  between requests, so every write would be lost. Use a hosted Turso database.\n"
  );
  process.exit(1);
}

if (!process.env.SESSION_SECRET?.trim()) {
  console.warn("  Warning: SESSION_SECRET is not set — admin sessions will not survive a redeploy.");
}

if (!process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
  console.warn(
    "  Warning: NEXT_PUBLIC_SITE_URL is not set — the sitemap, canonical URLs and\n" +
      "  social share cards will point at localhost."
  );
}

console.log("  Deployment environment looks good.");
