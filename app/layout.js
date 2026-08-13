import { Geist, Geist_Mono, Baloo_2 } from "next/font/google";
import "./globals.css";
import { getSettings, getCategories } from "@/lib/queries";
import { SITE_URL } from "@/lib/siteConfig";
import Navbar from "@/components/ui/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["400", "600", "800"] });

// The layout reads site settings (logo, contact details, menu) from the database
// on every render, so nothing under it can be prerendered at build time.
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "GoStudy — dustless chalk, two-sided boards, slates, study tables, dusters and wooden board games. Retail and bulk supply from Kaithal, Haryana.";

export const metadata = {
  // Without metadataBase, Open Graph image URLs stay relative and links shared
  // on WhatsApp / Facebook / Instagram render without a preview card.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GoStudy | Boards, Slates, Chalk, Study Tables & Games",
    template: "%s | GoStudy",
  },
  description: DESCRIPTION,
  applicationName: "GoStudy",
  keywords: [
    "whiteboard", "green board", "dustless chalk", "slate", "study table",
    "duster", "ludo", "chess", "school supplies", "bulk supply", "Kaithal", "Haryana",
  ],
  openGraph: {
    type: "website",
    siteName: "GoStudy",
    title: "GoStudy | Boards, Slates, Chalk, Study Tables & Games",
    description: DESCRIPTION,
    locale: "en_IN",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoStudy | Boards, Slates, Chalk, Study Tables & Games",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${baloo.variable} antialiased`}>
      <body suppressHydrationWarning className="antialiased">
        <Navbar settings={settings} categories={categories} />
        {children}
      </body>
    </html>
  );
}
