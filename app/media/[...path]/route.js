import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadDir } from "@/lib/storage";

/**
 * Serves admin-uploaded media when it lives on a mounted volume rather than in
 * public/ (see UPLOAD_DIR in lib/storage.js). Next only serves public/
 * statically, so hosts that reset the container on deploy need this route to
 * reach the persisted files.
 */
const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(_req, { params }) {
  const { path: segments } = await params;

  // Resolve inside the upload directory and verify we stayed there — a crafted
  // path must not be able to read arbitrary files off the server.
  const root = path.resolve(uploadDir());
  const target = path.resolve(root, ...segments);
  if (target !== root && !target.startsWith(root + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const type = TYPES[path.extname(target).toLowerCase()];
  if (!type) return new NextResponse("Not found", { status: 404 });

  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!stat.isFile()) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(fs.readFileSync(target), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(stat.size),
      // Filenames carry a timestamp and random suffix, so they are immutable
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
