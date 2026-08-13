import { Suspense } from "react";
import { getSettings, getProducts, getCategories, getPriceRanges, getAttributes } from "@/lib/queries";
import ProductsClient from "@/components/products/ProductsClient";
import Footer from "@/components/ui/Footer";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const [settings, products, categories, priceRanges, attributes] = await Promise.all([
    getSettings(),
    getProducts(),
    getCategories(),
    getPriceRanges(),
    getAttributes(),
  ]);

  return (
    <main>
      {/* ProductsClient reads its filters from the query string via useSearchParams */}
      <Suspense fallback={null}>
        <ProductsClient
          products={products}
          categories={categories}
          priceRanges={priceRanges}
          attributes={attributes}
        />
      </Suspense>
      <Footer settings={settings} />
    </main>
  );
}
