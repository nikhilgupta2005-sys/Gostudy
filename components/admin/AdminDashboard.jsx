"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductsTab from "@/components/admin/ProductsTab";
import CategoriesTab from "@/components/admin/CategoriesTab";
import AttributesTab from "@/components/admin/AttributesTab";
import PriceRangesTab from "@/components/admin/PriceRangesTab";
import CmsTab from "@/components/admin/CmsTab";
import EnquiriesTab from "@/components/admin/EnquiriesTab";
import UsersTab from "@/components/admin/UsersTab";
import styles from "@/styles/sections/Admin.module.css";

const TABS = [
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "attributes", label: "Filters" },
  { key: "prices", label: "Price Bands" },
  { key: "cms", label: "Home Page" },
  { key: "enquiries", label: "Enquiries" },
  { key: "users", label: "Users" },
];

export default function AdminDashboard({
  currentUser,
  initialProducts,
  initialCategories,
  initialAttributes,
  initialPriceRanges,
  initialSettings,
  initialEnquiries,
  initialUsers,
}) {
  const router = useRouter();
  const params = useSearchParams();

  // The tab is React state so switching is instant. The URL is kept in step with
  // history.replaceState rather than router.replace: every tab already has its
  // data on the client, so a router navigation would re-run all of the page's
  // database queries just to render the same thing.
  const [tab, setTabState] = useState(() => {
    const requested = params.get("tab");
    return TABS.some((t) => t.key === requested) ? requested : "products";
  });

  const setTab = (key) => {
    setTabState(key);
    window.history.replaceState(null, "", key === "products" ? "/admin" : `/admin?tab=${key}`);
  };

  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [attributes, setAttributes] = useState(initialAttributes);
  const [priceRanges, setPriceRanges] = useState(initialPriceRanges);
  const [settings, setSettings] = useState(initialSettings);
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [users, setUsers] = useState(initialUsers);

  const newEnquiries = enquiries.filter((e) => e.status === "new").length;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <main className={styles.admin}>
      <header className={styles.adminHead}>
        <div>
          <h1 className={styles.adminTitle}>Admin Dashboard</h1>
          <p className={styles.adminSub}>{settings.siteName}</p>
        </div>
        <div className={styles.adminHeadActions}>
          <span className={styles.whoami}>
            {currentUser.name}
            <em>{currentUser.role}</em>
          </span>
          <a href="/" className={styles.viewSite}>View Site ↗</a>
          <button onClick={logout} className={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <nav className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === "enquiries" && newEnquiries > 0 && (
              <span className={styles.tabBadge}>{newEnquiries}</span>
            )}
          </button>
        ))}
      </nav>

      <div className={styles.tabBody}>
        {tab === "products" && (
          <ProductsTab
            products={products}
            setProducts={setProducts}
            categories={categories}
            attributes={attributes}
          />
        )}
        {tab === "categories" && (
          <CategoriesTab categories={categories} setCategories={setCategories} />
        )}
        {tab === "attributes" && (
          <AttributesTab attributes={attributes} setAttributes={setAttributes} />
        )}
        {tab === "prices" && (
          <PriceRangesTab priceRanges={priceRanges} setPriceRanges={setPriceRanges} />
        )}
        {tab === "cms" && <CmsTab settings={settings} setSettings={setSettings} />}
        {tab === "enquiries" && (
          <EnquiriesTab enquiries={enquiries} setEnquiries={setEnquiries} />
        )}
        {tab === "users" && (
          <UsersTab users={users} setUsers={setUsers} currentUser={currentUser} />
        )}
      </div>
    </main>
  );
}
