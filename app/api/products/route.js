import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, withAdmin } from "@/lib/api";
import { getAllProducts, getProducts, getProduct, toProductView } from "@/lib/queries";
import { isAdmin } from "@/lib/auth";
import { externalUrl, mediaUrl } from "@/lib/validators";

const ProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  summary: z.string().default(""),
  description: z.string().default(""),
  categoryId: z.coerce.number().int().nullable().optional(),
  subcategory: z.string().default(""),
  pricingType: z.enum(["fixed", "range"]).default("fixed"),
  priceMin: z.coerce.number().int().min(0).default(0),
  priceMax: z.coerce.number().int().min(0).nullable().optional(),
  attributes: z.record(z.string(), z.string()).default({}),
  media: z
    .array(z.object({ url: mediaUrl, type: z.enum(["image", "video"]).default("image") }))
    .default([]),
  marketplace: z
    .object({
      amazon: externalUrl,
      flipkart: externalUrl,
      meesho: externalUrl,
    })
    .default({ amazon: "", flipkart: "", meesho: "" }),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

/** Turns the flat view-model into the relational writes Prisma needs. */
async function buildWrite(input) {
  const categoryId = input.categoryId ?? null;

  let subcategoryId = null;
  if (categoryId && input.subcategory) {
    const sub = await prisma.subcategory.findFirst({
      where: { categoryId, name: input.subcategory },
    });
    subcategoryId = sub?.id ?? null;
  }

  // Map { "Frame Color": "Green" } onto the matching option rows
  const optionIds = [];
  for (const [name, value] of Object.entries(input.attributes)) {
    if (!value) continue;
    const option = await prisma.attributeOption.findFirst({
      where: { value, attribute: { name } },
    });
    if (option) optionIds.push(option.id);
  }

  if (input.pricingType === "range" && (input.priceMax ?? 0) < input.priceMin) {
    throw Object.assign(new Error("range"), { userMessage: true });
  }

  return {
    data: {
      name: input.name,
      summary: input.summary,
      description: input.description,
      categoryId,
      subcategoryId,
      pricingType: input.pricingType,
      priceMin: input.priceMin,
      priceMax: input.pricingType === "range" ? input.priceMax ?? 0 : null,
      featured: input.featured,
      published: input.published,
      amazonUrl: input.marketplace.amazon,
      flipkartUrl: input.marketplace.flipkart,
      meeshoUrl: input.marketplace.meesho,
    },
    media: input.media.map((m, i) => ({ url: m.url, type: m.type, position: i })),
    optionIds,
  };
}

/**
 * Drafts are only for signed-in admins. Returning them here would publish
 * unreleased products and their prices to anyone who called the endpoint, even
 * though the catalogue page hides them.
 */
export async function GET() {
  const products = (await isAdmin()) ? await getAllProducts() : await getProducts();
  return ok({ products });
}

export const POST = withAdmin(ProductSchema, async (input) => {
  if (input.pricingType === "range" && (input.priceMax ?? 0) < input.priceMin) {
    return fail("Maximum price must be greater than the minimum price");
  }
  const { data, media, optionIds } = await buildWrite(input);
  const last = await prisma.product.findFirst({ orderBy: { position: "desc" } });

  const created = await prisma.product.create({
    data: {
      ...data,
      position: (last?.position ?? -1) + 1,
      media: { create: media },
      attributeValues: { create: optionIds.map((optionId) => ({ optionId })) },
    },
    include: {
      subcategory: true,
      media: { orderBy: { position: "asc" } },
      attributeValues: { include: { option: { include: { attribute: true } } } },
    },
  });
  return ok(toProductView(created));
});

export const PUT = withAdmin(
  ProductSchema.extend({ id: z.number().int() }),
  async (input) => {
    if (input.pricingType === "range" && (input.priceMax ?? 0) < input.priceMin) {
      return fail("Maximum price must be greater than the minimum price");
    }
    const { data, media, optionIds } = await buildWrite(input);

    // Media and attribute links are replaced wholesale — simpler and safer than
    // diffing, and these lists are tiny.
    await prisma.$transaction([
      prisma.productMedia.deleteMany({ where: { productId: input.id } }),
      prisma.productAttributeValue.deleteMany({ where: { productId: input.id } }),
      prisma.product.update({
        where: { id: input.id },
        data: {
          ...data,
          media: { create: media },
          attributeValues: { create: optionIds.map((optionId) => ({ optionId })) },
        },
      }),
    ]);

    return ok(await getProduct(input.id));
  }
);

export const DELETE = withAdmin(z.object({ id: z.number().int() }), async ({ id }) => {
  await prisma.product.delete({ where: { id } });
  return ok();
});

/** Reorder — accepts the full list of ids in their new order. */
export const PATCH = withAdmin(
  z.object({ order: z.array(z.number().int()).min(1) }),
  async ({ order }) => {
    await prisma.$transaction(
      order.map((id, position) => prisma.product.update({ where: { id }, data: { position } }))
    );
    return ok();
  }
);
