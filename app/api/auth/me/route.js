import { ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  return ok({ user: await getCurrentUser() });
}
