import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, withAdmin } from "@/lib/api";
import { getCategories, getPriceRanges } from "@/lib/queries";

export async function GET() {
  return ok({ categories: await getCategories(), priceRanges: await getPriceRanges() });
}

const view = (c) => ({
  id: c.id,
  name: c.name,
  subcategories: c.subcategories.map((s) => s.name),
});

export const POST = withAdmin(
  z.object({
    name: z.string().trim().min(1, "Name is required"),
    subcategories: z.array(z.string().trim().min(1)).default([]),
  }),
  async ({ name, subcategories }) => {
    const last = await prisma.category.findFirst({ orderBy: { position: "desc" } });
    const created = await prisma.category.create({
      data: {
        name,
        position: (last?.position ?? -1) + 1,
        subcategories: {
          create: [...new Set(subcategories)].map((n, i) => ({ name: n, position: i })),
        },
      },
      include: { subcategories: { orderBy: { position: "asc" } } },
    });
    return ok(view(created));
  }
);

export const PUT = withAdmin(
  z.object({
    id: z.number().int(),
    name: z.string().trim().min(1).optional(),
    subcategories: z.array(z.string().trim().min(1)).optional(),
  }),
  async ({ id, name, subcategories }) => {
    if (name) await prisma.category.update({ where: { id }, data: { name } });

    if (subcategories) {
      const wanted = [...new Set(subcategories)];
      const existing = await prisma.subcategory.findMany({ where: { categoryId: id } });

      // Removing a subcategory just unlinks its products — it never deletes them
      const removed = existing.filter((s) => !wanted.includes(s.name));
      if (removed.length) {
        await prisma.subcategory.deleteMany({ where: { id: { in: removed.map((s) => s.id) } } });
      }
      for (const [position, subName] of wanted.entries()) {
        const found = existing.find((s) => s.name === subName);
        if (found) {
          await prisma.subcategory.update({ where: { id: found.id }, data: { position } });
        } else {
          await prisma.subcategory.create({ data: { name: subName, position, categoryId: id } });
        }
      }
    }

    const updated = await prisma.category.findUnique({
      where: { id },
      include: { subcategories: { orderBy: { position: "asc" } } },
    });
    return ok(view(updated));
  }
);

export const DELETE = withAdmin(z.object({ id: z.number().int() }), async ({ id }) => {
  // Products keep existing; the schema sets their categoryId to null
  await prisma.category.delete({ where: { id } });
  return ok();
});

export const PATCH = withAdmin(
  z.object({ order: z.array(z.number().int()).min(1) }),
  async ({ order }) => {
    await prisma.$transaction(
      order.map((id, position) => prisma.category.update({ where: { id }, data: { position } }))
    );
    return ok();
  }
);
