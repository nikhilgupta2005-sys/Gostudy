"use client";

import { useState } from "react";
import { uploadFile } from "@/components/admin/uploadFile";
import { formatPrice } from "@/lib/format";
import styles from "@/styles/sections/Admin.module.css";

const EMPTY = {
  name: "",
  summary: "",
  description: "",
  categoryId: null,
  subcategory: "",
  pricingType: "fixed",
  priceMin: "",
  priceMax: "",
  attributes: {},
  media: [],
  marketplace: { amazon: "", flipkart: "", meesho: "" },
  featured: false,
  published: true,
};

export default function ProductsTab({ products, setProducts, categories, attributes = [] }) {
  const [editing, setEditing] = useState(null); // null | product object (id=null → new)
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const startNew = () => setEditing({ id: null, ...EMPTY, attributes: {} });
  const startEdit = (p) =>
    setEditing({ attributes: {}, ...JSON.parse(JSON.stringify(p)) });

  const setAttr = (name, value) =>
    setEditing((ed) => {
      const next = { ...ed.attributes };
      if (value) next[name] = value;
      else delete next[name];
      return { ...ed, attributes: next };
    });

  const set = (k, v) => setEditing((e) => ({ ...e, [k]: v }));

  const activeCat = categories.find((c) => c.id === Number(editing?.categoryId));

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      for (const f of files) {
        const media = await uploadFile(f);
        setEditing((ed) => ({ ...ed, media: [...ed.media, media] }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const removeMedia = (i) =>
    setEditing((ed) => ({ ...ed, media: ed.media.filter((_, idx) => idx !== i) }));

  const moveMedia = (i, dir) =>
    setEditing((ed) => {
      const m = [...ed.media];
      const j = i + dir;
      if (j < 0 || j >= m.length) return ed;
      [m[i], m[j]] = [m[j], m[i]];
      return { ...ed, media: m };
    });

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...editing,
        categoryId: editing.categoryId ? Number(editing.categoryId) : null,
      };
      const res = await fetch("/api/products", {
        method: editing.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setProducts((ps) =>
        editing.id ? ps.map((p) => (p.id === data.id ? data : p)) : [...ps, data]
      );
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id }),
    });
    setProducts((ps) => ps.filter((x) => x.id !== p.id));
  };

  if (editing) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>{editing.id ? "Edit Product" : "New Product"}</h2>
          <button className={styles.ghostBtn} onClick={() => setEditing(null)}>← Back</button>
        </div>

        <div className={styles.formGrid}>
          <label className={styles.f}>
            <span>Name *</span>
            <input value={editing.name} onChange={(e) => set("name", e.target.value)} />
          </label>

          <label className={styles.f}>
            <span>Category</span>
            <select
              value={editing.categoryId ?? ""}
              onChange={(e) => { set("categoryId", e.target.value || null); set("subcategory", ""); }}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          {activeCat?.subcategories?.length > 0 && (
            <label className={styles.f}>
              <span>Subcategory</span>
              <select value={editing.subcategory} onChange={(e) => set("subcategory", e.target.value)}>
                <option value="">— None —</option>
                {activeCat.subcategories.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          )}

          <label className={styles.f}>
            <span>Pricing Type</span>
            <select value={editing.pricingType} onChange={(e) => set("pricingType", e.target.value)}>
              <option value="fixed">Fixed price (e.g. ₹200)</option>
              <option value="range">Price range (e.g. ₹100 – ₹200)</option>
            </select>
          </label>

          <label className={styles.f}>
            <span>{editing.pricingType === "range" ? "Min Price (₹)" : "Price (₹)"}</span>
            <input type="number" value={editing.priceMin} onChange={(e) => set("priceMin", e.target.value)} />
          </label>

          {editing.pricingType === "range" && (
            <label className={styles.f}>
              <span>Max Price (₹)</span>
              <input type="number" value={editing.priceMax ?? ""} onChange={(e) => set("priceMax", e.target.value)} />
            </label>
          )}

          <label className={`${styles.f} ${styles.fWide}`}>
            <span>Short Summary (shown at top of product page)</span>
            <textarea rows={2} value={editing.summary} onChange={(e) => set("summary", e.target.value)} />
          </label>

          <label className={`${styles.f} ${styles.fWide}`}>
            <span>Full Description (shown at bottom)</span>
            <textarea rows={5} value={editing.description} onChange={(e) => set("description", e.target.value)} />
          </label>

          {attributes.length > 0 && (
            <div className={`${styles.f} ${styles.fWide}`}>
              <span>Filters / Specs (manage the options on the Filters tab)</span>
              <div className={styles.attrGrid}>
                {attributes.map((attr) => (
                  <label key={attr.id} className={styles.f}>
                    <span>{attr.name}</span>
                    <select
                      value={editing.attributes?.[attr.name] || ""}
                      onChange={(e) => setAttr(attr.name, e.target.value)}
                    >
                      <option value="">— Not set —</option>
                      {attr.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className={`${styles.f} ${styles.fWide}`}>
            <span>Media (images / videos — first one is the cover)</span>
            <div className={styles.mediaRow}>
              {editing.media.map((m, i) => (
                <div key={m.url + i} className={styles.mediaChip}>
                  {m.type === "video" ? (
                    <video src={m.url} muted />
                  ) : (
                    <img src={m.url} alt="" />
                  )}
                  <div className={styles.mediaChipBtns}>
                    <button onClick={() => moveMedia(i, -1)} title="Move left">◀</button>
                    <button onClick={() => removeMedia(i)} title="Remove">✕</button>
                    <button onClick={() => moveMedia(i, 1)} title="Move right">▶</button>
                  </div>
                  {i === 0 && <span className={styles.coverTag}>COVER</span>}
                </div>
              ))}
              <label className={styles.uploadBox}>
                {busy ? "…" : "+ Upload"}
                <input type="file" hidden multiple accept="image/*,video/mp4,video/webm" onChange={onUpload} />
              </label>
            </div>
          </div>

          <label className={styles.f}>
            <span>Amazon Link</span>
            <input value={editing.marketplace.amazon} onChange={(e) => set("marketplace", { ...editing.marketplace, amazon: e.target.value })} placeholder="https://…" />
          </label>
          <label className={styles.f}>
            <span>Flipkart Link</span>
            <input value={editing.marketplace.flipkart} onChange={(e) => set("marketplace", { ...editing.marketplace, flipkart: e.target.value })} placeholder="https://…" />
          </label>
          <label className={styles.f}>
            <span>Meesho Link</span>
            <input value={editing.marketplace.meesho} onChange={(e) => set("marketplace", { ...editing.marketplace, meesho: e.target.value })} placeholder="https://…" />
          </label>

          <label className={styles.checkRow}>
            <input type="checkbox" checked={editing.featured} onChange={(e) => set("featured", e.target.checked)} />
            <span>Featured on Home Page (Highlighted Products)</span>
          </label>

          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={editing.published !== false}
              onChange={(e) => set("published", e.target.checked)}
            />
            <span>Visible on the website (uncheck to keep it as a draft)</span>
          </label>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.panelActions}>
          <button className="pillBtn pillBtn--solid" onClick={save} disabled={busy || !editing.name.trim()}>
            {busy ? "Saving…" : "Save Product"}
          </button>
          <button className={styles.ghostBtn} onClick={() => setEditing(null)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Products ({products.length})</h2>
        <button className="pillBtn pillBtn--solid" onClick={startNew}>+ Add Product</button>
      </div>

      <div className={styles.list}>
        {products.map((p) => {
          const cat = categories.find((c) => c.id === p.categoryId);
          return (
            <div key={p.id} className={styles.listItem}>
              <div className={styles.listThumb}>
                {p.media?.[0] ? (
                  p.media[0].type === "video" ? (
                    <video src={p.media[0].url} muted />
                  ) : (
                    <img src={p.media[0].url} alt="" />
                  )
                ) : (
                  <span>—</span>
                )}
              </div>
              <div className={styles.listInfo}>
                <strong>
                  {p.name}
                  {p.featured && <em className={styles.featuredTag}>★ Featured</em>}
                  {p.published === false && <em className={styles.draftTag}>Draft</em>}
                </strong>
                <span>
                  {cat ? cat.name : "Uncategorised"}{p.subcategory ? ` · ${p.subcategory}` : ""} · {formatPrice(p)}
                  {" "}({p.pricingType === "range" ? "range" : "fixed"})
                </span>
              </div>
              <div className={styles.listBtns}>
                <button className={styles.ghostBtn} onClick={() => startEdit(p)}>Edit</button>
                <button className={styles.dangerBtn} onClick={() => remove(p)}>Delete</button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && <p className={styles.emptyMsg}>No products yet — add your first one.</p>}
      </div>
    </div>
  );
}
