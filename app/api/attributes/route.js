import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, withAdmin } from "@/lib/api";
import { getAttributes } from "@/lib/queries";

export async function GET() {
  return ok({ attributes: await getAttributes() });
}

const view = (a) => ({ id: a.id, name: a.name, options: a.options.map((o) => o.value) });

export const POST = withAdmin(
  z.object({
    name: z.string().trim().min(1, "Name is required"),
    options: z.array(z.string().trim().min(1)).default([]),
  }),
  async ({ name, options }) => {
    const last = await prisma.attribute.findFirst({ orderBy: { position: "desc" } });
    const created = await prisma.attribute.create({
      data: {
        name,
        position: (last?.position ?? -1) + 1,
        options: { create: [...new Set(options)].map((value, i) => ({ value, position: i })) },
      },
      include: { options: { orderBy: { position: "asc" } } },
    });
    return ok(view(created));
  }
);

export const PUT = withAdmin(
  z.object({
    id: z.number().int(),
    name: z.string().trim().min(1).optional(),
    options: z.array(z.string().trim().min(1)).optional(),
  }),
  async ({ id, name, options }) => {
    if (name) await prisma.attribute.update({ where: { id }, data: { name } });

    if (options) {
      const wanted = [...new Set(options)];
      const existing = await prisma.attributeOption.findMany({ where: { attributeId: id } });

      // Deleting an option cascades to ProductAttributeValue, so products that
      // used it simply lose that one spec rather than breaking.
      const removed = existing.filter((o) => !wanted.includes(o.value));
      if (removed.length) {
        await prisma.attributeOption.deleteMany({
          where: { id: { in: removed.map((o) => o.id) } },
        });
      }
      for (const [position, value] of wanted.entries()) {
        const found = existing.find((o) => o.value === value);
        if (found) {
          await prisma.attributeOption.update({ where: { id: found.id }, data: { position } });
        } else {
          await prisma.attributeOption.create({ data: { value, position, attributeId: id } });
        }
      }
    }

    const updated = await prisma.attribute.findUnique({
      where: { id },
      include: { options: { orderBy: { position: "asc" } } },
    });
    return ok(view(updated));
  }
);

export const DELETE = withAdmin(z.object({ id: z.number().int() }), async ({ id }) => {
  await prisma.attribute.delete({ where: { id } });
  return ok();
});
