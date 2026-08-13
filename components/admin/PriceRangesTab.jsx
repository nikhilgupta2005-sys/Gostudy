"use client";

import { useState } from "react";
import styles from "@/styles/sections/Admin.module.css";

export default function PriceRangesTab({ priceRanges, setPriceRanges }) {
  const [rows, setRows] = useState(priceRanges);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const patch = (i, key, value) => {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
    setSaved(false);
  };

  const addRow = () => {
    setRows((rs) => [...rs, { label: "", min: 0, max: 1000 }]);
    setSaved(false);
  };

  const removeRow = (i) => {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
    setSaved(false);
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    setSaved(false);
  };

  const save = async () => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/price-ranges", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceRanges: rows.map((r) => ({
          label: r.label,
          min: Number(r.min) || 0,
          max: Number(r.max) || 0,
        })),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setRows(data.priceRanges);
    setPriceRanges(data.priceRanges);
    setSaved(true);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Price Bands ({rows.length})</h2>
        <button className={styles.ghostBtn} onClick={addRow}>+ Add band</button>
      </div>
      <p className={styles.hint}>
        These are the price filters shoppers see on the Products page. A product matches a band when
        its price overlaps it — so a ₹150–₹450 range product shows under both “Under ₹200” and
        “₹200 – ₹400”. Use ₹ in the label exactly as you want it displayed.
      </p>

      <div className={styles.list}>
        {rows.map((r, i) => (
          <div key={i} className={styles.listItem}>
            <div className={styles.editFieldsWide}>
              <label className={styles.f}>
                <span>Label shown on site</span>
                <input
                  value={r.label}
                  onChange={(e) => patch(i, "label", e.target.value)}
                  placeholder="e.g. ₹200 – ₹400"
                />
              </label>
              <label className={styles.f}>
                <span>From (₹)</span>
                <input type="number" value={r.min} onChange={(e) => patch(i, "min", e.target.value)} />
              </label>
              <label className={styles.f}>
                <span>To (₹)</span>
                <input type="number" value={r.max} onChange={(e) => patch(i, "max", e.target.value)} />
              </label>
            </div>
            <div className={styles.listBtns}>
              <button className={styles.ghostBtn} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className={styles.ghostBtn} onClick={() => move(i, 1)} disabled={i === rows.length - 1}>↓</button>
              <button className={styles.dangerBtn} onClick={() => removeRow(i)}>Remove</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className={styles.emptyMsg}>No price bands — the Price filter will be hidden.</p>
        )}
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}
      {saved && <p className={styles.savedMsg}>✓ Saved — changes are live.</p>}

      <div className={styles.panelActions}>
        <button className="pillBtn pillBtn--solid" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save Price Bands"}
        </button>
      </div>
    </div>
  );
}
