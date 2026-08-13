"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import styles from "@/styles/sections/Products.module.css";

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const attrParam = (name) => `a.${slug(name)}`;

export default function ProductsClient({ products, categories, priceRanges, attributes = [] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── The URL is the single source of truth for every filter ──
  // Sidebar clicks and sidebar-menu links both just change the query string,
  // so they can never disagree with what the grid shows.
  const rawCategory = Number(params.get("category"));
  const activeCategory = categories.find((c) => c.id === rawCategory) || null;
  const categoryId = activeCategory?.id ?? null;

  const rawType = params.get("type") || "";
  const subcategory = activeCategory?.subcategories.includes(rawType) ? rawType : "";

  const rawPrice = params.get("price");
  const rangeIdx = rawPrice !== null && priceRanges[Number(rawPrice)] ? Number(rawPrice) : null;

  // Attribute filters, e.g. ?a.frame-color=Green — unknown values are ignored
  const activeAttrs = useMemo(() => {
    const out = {};
    for (const attr of attributes) {
      const v = params.get(attrParam(attr.name));
      if (v && attr.options.includes(v)) out[attr.name] = v;
    }
    return out;
  }, [attributes, params]);

  const setFilters = (patch) => {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") sp.delete(key);
      else sp.set(key, value);
    }
    const qs = sp.toString();
    router.push(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  const inPriceRange = (p, r) => {
    const lo = p.priceMin;
    const hi = p.pricingType === "range" ? p.priceMax : p.priceMin;
    // overlap test: product price band intersects filter band
    return !(hi < r.min || lo > r.max);
  };

  // Products matching only category + subcategory — drives which attribute
  // options are worth showing, so the sidebar never lists dead ends.
  const inCategory = useMemo(
    () =>
      products.filter((p) => {
        if (categoryId && p.categoryId !== categoryId) return false;
        if (subcategory && p.subcategory !== subcategory) return false;
        return true;
      }),
    [products, categoryId, subcategory]
  );

  const filtered = useMemo(
    () =>
      inCategory.filter((p) => {
        if (rangeIdx !== null && !inPriceRange(p, priceRanges[rangeIdx])) return false;
        for (const [name, value] of Object.entries(activeAttrs)) {
          if (p.attributes?.[name] !== value) return false;
        }
        return true;
      }),
    [inCategory, rangeIdx, priceRanges, activeAttrs]
  );

  // Only offer attribute options that exist on products in this category
  const attrGroups = useMemo(
    () =>
      attributes
        .map((attr) => ({
          ...attr,
          options: attr.options.filter((o) =>
            inCategory.some((p) => p.attributes?.[attr.name] === o)
          ),
        }))
        .filter((attr) => attr.options.length > 0),
    [attributes, inCategory]
  );

  // Switching category drops the old subcategory and attributes — they belong to the previous one
  const pickCategory = (id) => {
    const cleared = { category: id, type: null };
    for (const attr of attributes) cleared[attrParam(attr.name)] = null;
    setFilters(cleared);
  };

  const clearAll = () => {
    const cleared = { category: null, type: null, price: null };
    for (const attr of attributes) cleared[attrParam(attr.name)] = null;
    setFilters(cleared);
  };

  const hasFilters =
    categoryId || subcategory || rangeIdx !== null || Object.keys(activeAttrs).length > 0;

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <p className={styles.kicker}>Catalogue</p>
        <h1 className={styles.title}>{activeCategory ? activeCategory.name : "All Products"}</h1>
        <p className={styles.count}>{filtered.length} product{filtered.length === 1 ? "" : "s"}</p>
      </div>

      <button className={styles.filterToggle} onClick={() => setFiltersOpen(!filtersOpen)}>
        {filtersOpen ? "Hide Filters" : "Show Filters"} {hasFilters ? "•" : ""}
      </button>

      <div className={styles.layout}>
        <aside className={`${styles.sidebar} ${filtersOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.filterGroup}>
            <h4 className={styles.filterTitle}>Category</h4>
            <button
              className={`${styles.filterOpt} ${!categoryId ? styles.filterActive : ""}`}
              onClick={() => pickCategory(null)}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`${styles.filterOpt} ${categoryId === c.id ? styles.filterActive : ""}`}
                onClick={() => pickCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

          {activeCategory?.subcategories?.length > 0 && (
            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Type</h4>
              <button
                className={`${styles.filterOpt} ${!subcategory ? styles.filterActive : ""}`}
                onClick={() => setFilters({ type: null })}
              >
                All
              </button>
              {activeCategory.subcategories.map((s) => (
                <button
                  key={s}
                  className={`${styles.filterOpt} ${subcategory === s ? styles.filterActive : ""}`}
                  onClick={() => setFilters({ type: s })}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className={styles.filterGroup}>
            <h4 className={styles.filterTitle}>Price</h4>
            <button
              className={`${styles.filterOpt} ${rangeIdx === null ? styles.filterActive : ""}`}
              onClick={() => setFilters({ price: null })}
            >
              Any price
            </button>
            {priceRanges.map((r, i) => (
              <button
                key={r.label}
                className={`${styles.filterOpt} ${rangeIdx === i ? styles.filterActive : ""}`}
                onClick={() => setFilters({ price: i })}
              >
                {r.label}
              </button>
            ))}
          </div>

          {attrGroups.map((attr) => (
            <div key={attr.id} className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>{attr.name}</h4>
              <button
                className={`${styles.filterOpt} ${!activeAttrs[attr.name] ? styles.filterActive : ""}`}
                onClick={() => setFilters({ [attrParam(attr.name)]: null })}
              >
                All
              </button>
              {attr.options.map((o) => (
                <button
                  key={o}
                  className={`${styles.filterOpt} ${activeAttrs[attr.name] === o ? styles.filterActive : ""}`}
                  onClick={() => setFilters({ [attrParam(attr.name)]: o })}
                >
                  {o}
                </button>
              ))}
            </div>
          ))}

          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearAll}>
              Clear all filters ✕
            </button>
          )}
        </aside>

        <div className={styles.gridWrap}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>No products match these filters.</p>
              <button className="pillBtn" onClick={clearAll}>Clear Filters</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
