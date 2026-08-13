import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllProducts,
  getCategories,
  getAttributes,
  getPriceRanges,
  getSettings,
  getEnquiries,
  getAdminUsers,
} from "@/lib/queries";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) {
    // Remember which tab they were heading for so signing in returns them there
    const { tab } = await searchParams;
    const next = tab ? `/admin?tab=${encodeURIComponent(tab)}` : "/admin";
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }

  const [products, categories, attributes, priceRanges, settings, enquiries, users] =
    await Promise.all([
      getAllProducts(),
      getCategories(),
      getAttributes(),
      getPriceRanges(),
      getSettings(),
      getEnquiries(),
      getAdminUsers(),
    ]);

  return (
    // AdminDashboard reads the active tab from the query string
    <Suspense fallback={null}>
      <AdminDashboard
        currentUser={user}
        initialProducts={products}
        initialCategories={categories}
        initialAttributes={attributes}
        initialPriceRanges={priceRanges}
        initialSettings={settings}
        initialEnquiries={JSON.parse(JSON.stringify(enquiries))}
        initialUsers={JSON.parse(JSON.stringify(users))}
      />
    </Suspense>
  );
}
