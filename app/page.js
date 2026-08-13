import { getSettings, getFeaturedProducts } from "@/lib/queries";
import Hero from "@/components/home/Hero";
import PromoMedia from "@/components/home/PromoMedia";
import Counters from "@/components/home/Counters";
import Featured from "@/components/home/Featured";
import Footer from "@/components/ui/Footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featured] = await Promise.all([getSettings(), getFeaturedProducts()]);
  return (
    <main>
      <Hero settings={settings} />
      <PromoMedia settings={settings} />
      <Counters stats={settings.stats} />
      <Featured products={featured} />
      <Footer settings={settings} />
    </main>
  );
}
