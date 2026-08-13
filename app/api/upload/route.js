import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(req) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file received" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 15 MB" }, { status: 413 });
  }

  try {
    return NextResponse.json(await saveUpload(file));
  } catch (err) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 400 });
  }
}
