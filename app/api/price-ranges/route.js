import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, withAdmin } from "@/lib/api";
import { getPriceRanges } from "@/lib/queries";

export async function GET() {
  return ok({ priceRanges: await getPriceRanges() });
}

/** Saved as a whole list — the admin edits these as one small table. */
export const PUT = withAdmin(
  z.object({
    priceRanges: z
      .array(
        z.object({
          label: z.string().trim().min(1, "Label is required"),
          min: z.coerce.number().int().min(0),
          max: z.coerce.number().int().min(0),
        })
      )
      .default([]),
  }),
  async ({ priceRanges }) => {
    const bad = priceRanges.find((r) => r.max < r.min);
    if (bad) return fail(`"${bad.label}": maximum must be greater than the minimum`);

    await prisma.$transaction([
      prisma.priceRange.deleteMany({}),
      prisma.priceRange.createMany({
        data: priceRanges.map((r, i) => ({ ...r, position: i })),
      }),
    ]);
    return ok({ priceRanges: await getPriceRanges() });
  }
);
