import { SITE_URL } from "@/lib/siteConfig";
import { getProducts, getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const now = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...categories.map((c) => ({
      url: `${SITE_URL}/products?category=${c.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    })),
  ];
}
