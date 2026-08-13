import { notFound } from "next/navigation";
import { getSettings, getProduct, getCategories } from "@/lib/queries";
import ProductView from "@/components/products/ProductView";
import Footer from "@/components/ui/Footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product) return { title: "Product" };

  // Share the product's own photo, so a link pasted into WhatsApp shows the item
  const cover = product.media.find((m) => m.type === "image")?.url;

  return {
    title: product.name,
    description: product.summary || undefined,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.summary || undefined,
      url: `/products/${product.id}`,
      ...(cover ? { images: [{ url: cover }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.summary || undefined,
      ...(cover ? { images: [cover] } : {}),
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product || !product.published) notFound();

  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <main>
      <ProductView product={product} category={category} settings={settings} />
      <Footer settings={settings} />
    </main>
  );
}
