# GoStudy — catalogue site + admin dashboard

Product catalogue and bulk-enquiry site for **GoStudy** (Bansal Trading Company, Kaithal, Haryana),
with a full admin dashboard.

Stack: Next.js 16 (App Router) · React 19 · Prisma 7 · SQLite (libSQL) · Tailwind v4 · GSAP.

---

## Running it locally

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Site: <http://localhost:3500> · Dashboard: <http://localhost:3500/admin>

First sign-in uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`. **Change that password from
the Users tab before the site goes live.**

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3500 |
| `npm run build` | Generates the Prisma client, then builds for production |
| `npm start` | Serves the production build |
| `npm run db:migrate` | Creates/applies a migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Applies existing migrations (use this on the server) |
| `npm run db:seed` | Fills empty tables from `prisma/legacy-db.json`; safe to re-run |
| `npm run db:studio` | Opens Prisma Studio to browse the database |
| `npm run db:reset` | **Wipes** the database and re-seeds it |

---

## Environment

`.env` (committed — no secrets):

```
DATABASE_URL="file:./data/gostudy.db"
```

`.env.local` (never commit):

```
SESSION_SECRET=<long random string>
ADMIN_NAME=GoStudy Admin
ADMIN_EMAIL=admin@gostudy.in
ADMIN_PASSWORD=<first-run password>
```

Optional:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_AUTH_TOKEN` | – | Turso auth token when `DATABASE_URL` points at a hosted database |
| `STORAGE_DRIVER` | `local` | Where uploads are written — see *Going live* |

---

## How the data is organised

`prisma/schema.prisma` is the source of truth. The shapes the UI consumes are assembled in
`lib/queries.js`, which flattens the relational rows back into the view models the components
expect (`attributes` as a name → value map, `media` as an ordered array, `marketplace` as one
object). Components never touch Prisma directly.

- **Category** → **Subcategory** — the sidebar menu and the Type filter.
- **Attribute** → **AttributeOption** — admin-defined filter facets (Frame Color, Size, …).
  A product links to options through `ProductAttributeValue`, so renaming an option updates
  every product at once and deleting one just drops that spec.
- **PriceRange** — the price filter bands, editable from the dashboard.
- **Setting** (single row) + **Stat** — everything on the Home Page tab.
- **Enquiry** — bulk-purchase submissions, with a `new / contacted / closed` status.
- **AdminUser** + **Session** — dashboard logins.

### Filters are URL-driven

`ProductsClient` reads every filter from `useSearchParams` and writes changes back with
`router.push`. Do **not** reintroduce `useState` seeded from props there: changing only the query
string does not remount the component, so the two silently desync — that was a real bug once.

---

## Security

- Every write endpoint requires a session and validates its body with zod; user management
  additionally requires an `owner` account.
- `GET /api/products` returns drafts only to a signed-in admin, and `GET /api/settings` hides the
  internal alert routing from the public — the pages hide both, and so does the API.
- The public enquiry endpoint is throttled (8/hour per IP, 4/hour per phone). It is
  unauthenticated and sends email, so it would otherwise be an easy way to fill the dashboard and
  burn the mail quota.
- Uploads are restricted by extension and capped at 15 MB. **SVG is deliberately rejected** — it
  can carry `<script>`, and files are served from the site's own origin.
- Any admin-entered value that becomes an `href` or `src` (marketplace links, social links, maps
  link, logo, media) must be `http(s)` or an uploaded path, so a compromised admin account cannot
  plant a `javascript:` URL as stored XSS.
- Responses carry `X-Frame-Options: DENY` and `frame-ancestors 'none'` (clickjacking on a
  logged-in admin), `nosniff`, a strict referrer policy, and no `X-Powered-By`. `/admin` and
  `/api` are marked `no-store`.
- Passwords are bcrypt hashed (cost 12) and never returned by any endpoint.
- Sessions are random 32-byte tokens; only their SHA-256 digest is stored, so a database dump
  cannot be replayed as a live session. They expire after 7 days.
- Changing a password revokes every existing session for that user.
- Sign-in is throttled to 8 failed attempts per email per 15 minutes.
- Wrong password and unknown email return the identical message, so the form can't be used to
  enumerate accounts.
- Every write endpoint validates its body with zod and requires a session; user management
  additionally requires an `owner` account.
- The system always keeps at least one owner, and nobody can delete the account they're using.

---

## Going live

The app runs unchanged on two very different kinds of host. Pick one, set the environment
variables, deploy. `/api/health` reports what it actually resolved, so check it after release.

### A host with a real disk — VPS, Render, Railway, Fly

Nothing to change. Keep `DATABASE_URL="file:./data/gostudy.db"`, put `data/` on the persistent
volume, and run `npm run db:deploy` on each release. Uploads keep going to `public/uploads`.

### Vercel (serverless)

Vercel gives every request a fresh, read-only filesystem, so **both** the database and the upload
directory have to move off disk. The code already supports this; it is configuration only.

**1. Database → Turso** (hosted SQLite, free tier, commercial use allowed)

```bash
npm i -g @tursodatabase/cli   # or: brew install tursodatabase/tap/turso
turso auth signup
turso db create gostudy
turso db show gostudy --url          # → libsql://gostudy-<org>.turso.io
turso db tokens create gostudy       # → the auth token
```

**2. Uploads → Vercel Blob** — in the Vercel dashboard: *Storage → Create → Blob*, then connect it
to the project. That sets `BLOB_READ_WRITE_TOKEN` automatically and the app picks it up with no
further configuration. ([Cloudinary](https://cloudinary.com) works too — set the `CLOUDINARY_*`
variables instead.)

**3. Environment variables** (Vercel → Settings → Environment Variables)

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `libsql://gostudy-<org>.turso.io` |
| `DATABASE_AUTH_TOKEN` | the token from `turso db tokens create` |
| `SESSION_SECRET` | a long random string |
| `NEXT_PUBLIC_SITE_URL` | `https://gostudy.in` |
| `BLOB_READ_WRITE_TOKEN` | set for you by the Blob store |

**4. Seed the production database once**, from your machine:

```bash
DATABASE_URL="libsql://…" DATABASE_AUTH_TOKEN="…" npm run db:seed
```

Deploys run the `vercel-build` script, which applies any pending migrations
(`prisma migrate deploy`) before building.

**5. Verify** — open `https://your-domain/api/health`. It must report
`database.kind: "hosted (libSQL/Turso)"`, `database.reachable: true` and a storage driver that
is not `local`. It returns HTTP 503 if either is wrong, so an uptime monitor will catch it.

### Guard rails

These misconfigurations fail loudly instead of silently losing data:

- No `DATABASE_URL` in production → the app refuses to start.
- A `file:` database URL in production → refused, because those writes are discarded.
- The `local` upload driver on Vercel → uploads are rejected with an explanatory message.

### Launch checklist

**Must do — the site is wrong without these**

- [ ] `SESSION_SECRET` — a long random string, not the value in the repo.
- [ ] `NEXT_PUBLIC_SITE_URL` — `https://your-domain`. Without it every canonical URL, the sitemap
      and the social share cards point at `localhost`, so links shared on WhatsApp / Instagram /
      Facebook render without a preview.
- [ ] Sign in and change the seeded admin password (Users tab), then remove unused accounts.
- [ ] Point the domain at the host and confirm HTTPS.
- [ ] Open `/api/health` and confirm it returns 200 with the expected database and storage driver.

**Should do**

- [ ] Backups — `data/gostudy.db` on a disk host, or Turso's own backups.
- [ ] Submit `https://your-domain/sitemap.xml` in Google Search Console.
- [ ] Send a test bulk enquiry from the live site and confirm it lands in the dashboard.

### What ships out of the box

- `robots.txt` allowing the catalogue and blocking `/admin` and `/api`.
- `sitemap.xml` generated from the database — home, catalogue, every category and every product.
- Favicon and a branded Open Graph card; product pages share their own photo.
- `/api/health` for uptime monitoring.

### Enquiry email alerts

When a customer submits the bulk purchase form the shop is emailed straight away, with Call and
WhatsApp buttons and a link into the dashboard.

Who receives it, and whether it is on at all, is set in the dashboard (**Home Page → Enquiry Email
Alerts**); leaving the address blank falls back to the site's contact email. The server only
decides *how* mail is sent:

| Variable | Notes |
| --- | --- |
| `RESEND_API_KEY` | [resend.com](https://resend.com) — 3,000 emails/month free |
| `BREVO_API_KEY` | [brevo.com](https://brevo.com) — 300 emails/day free |
| `MAIL_FROM` | e.g. `GoStudy <orders@gostudy.in>` — must be on a domain verified with the provider |
| `MAIL_DRIVER` | optional; otherwise inferred from whichever key is set |

With no key configured the alert is written to the server log instead, so nothing breaks — it just
does not leave the machine. Use **Send test email** on that same tab to confirm delivery without
waiting for a real customer.

Alerts are deliberately best effort: the enquiry is written to the database first, and a mail
failure is logged and swallowed. A provider outage can never cost you a customer's enquiry.

---

## Known content to confirm with the client

The brief (`Rajinder Kumar Details for the Website 1.docx`) has two likely typos:

1. The logo image reads **"Learn • Earse • Repeat"** — "Erase" is presumably intended. The text
   tagline uses the correct spelling; the PNG still has the typo and needs regenerating.
2. The email was given as `Bansal0925@gamil.com`; the site uses `bansal0925@gmail.com`.
