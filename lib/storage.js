import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Where admin-uploaded images and videos go.
 *
 *   local        → public/uploads. Development, and any host with a real disk
 *                  (VPS, Render, Railway, Fly).
 *   vercel-blob  → Vercel Blob store. Needs BLOB_READ_WRITE_TOKEN.
 *   cloudinary   → Cloudinary. Needs CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET.
 *
 * A serverless filesystem is read-only and thrown away between requests, so the
 * local driver cannot be used on Vercel — hence the guard in resolveDriver().
 */
// SVG is deliberately excluded: it can carry <script>, and these files are
// served from the site's own origin, so an uploaded SVG becomes stored XSS.
const ALLOWED = {
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".webp": "image",
  ".gif": "image",
  ".mp4": "video",
  ".webm": "video",
};

function safeName(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const kind = ALLOWED[ext];
  if (!kind) throw new Error(`${ext || "That file type"} is not allowed`);

  const base = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9-_]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");

  const stamp = crypto.randomBytes(4).toString("hex");
  return { filename: `${Date.now()}-${base || "file"}-${stamp}${ext}`, kind, ext };
}

/** Explicit STORAGE_DRIVER wins; otherwise infer from the credentials present. */
function resolveDriver() {
  if (process.env.STORAGE_DRIVER) return process.env.STORAGE_DRIVER;
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel-blob";
  if (process.env.CLOUDINARY_CLOUD_NAME) return "cloudinary";
  return "local";
}

// ── Drivers ──────────────────────────────────────────────────

/**
 * Where the local driver writes.
 *
 * Without UPLOAD_DIR it uses public/uploads, which Next serves statically —
 * fine for development. Hosts that reset the container on each deploy (Railway,
 * Fly, Render) must point UPLOAD_DIR at a mounted volume instead, or every
 * uploaded image disappears on the next release. Those files live outside
 * public/, so they are served by app/media/[...path].
 */
export const uploadDir = () =>
  process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "public", "uploads");

const servesFromVolume = () => !!process.env.UPLOAD_DIR?.trim();

async function saveLocal(file) {
  const { filename, kind } = safeName(file.name);
  const dir = uploadDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return {
    url: servesFromVolume() ? `/media/${filename}` : `/uploads/${filename}`,
    type: kind,
  };
}

async function saveVercelBlob(file) {
  const { filename, kind } = safeName(file.name);
  const { put } = await import("@vercel/blob");
  const blob = await put(`uploads/${filename}`, file, {
    access: "public",
    contentType: file.type || undefined,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { url: blob.url, type: kind };
}

async function saveCloudinary(file) {
  const { filename, kind } = safeName(file.name);
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is selected but CLOUDINARY_* environment variables are missing");
  }

  const folder = process.env.CLOUDINARY_FOLDER || "gostudy";
  const publicId = filename.replace(/\.[^.]+$/, "");
  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary signs the alphabetically sorted params, excluding file/api_key
  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("signature", signature);

  const resourceType = kind === "video" ? "video" : "image";
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Cloudinary upload failed");

  return { url: data.secure_url, type: kind };
}

export async function saveUpload(file) {
  const driver = resolveDriver();

  if (driver === "local" && process.env.VERCEL) {
    throw new Error(
      "Uploads need cloud storage on Vercel — the filesystem there is read-only. " +
        "Create a Blob store (sets BLOB_READ_WRITE_TOKEN) or set the CLOUDINARY_* variables."
    );
  }

  switch (driver) {
    case "local":
      return saveLocal(file);
    case "vercel-blob":
      return saveVercelBlob(file);
    case "cloudinary":
      return saveCloudinary(file);
    default:
      throw new Error(
        `Unknown STORAGE_DRIVER "${driver}". Supported: local, vercel-blob, cloudinary.`
      );
  }
}

export { resolveDriver };
