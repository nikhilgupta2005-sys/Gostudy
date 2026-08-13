"use client";

import { useState } from "react";
import styles from "@/styles/sections/Admin.module.css";

const STATUSES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "closed", label: "Closed" },
];

/** wa.me needs a country code; customers usually type a bare 10-digit number. */
function waNumber(phone) {
  const digits = String(phone).replace(/\D/g, "").replace(/^0+/, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export default function EnquiriesTab({ enquiries, setEnquiries }) {
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  const shown = filter === "all" ? enquiries : enquiries.filter((e) => e.status === filter);

  const patch = async (id, body) => {
    setBusyId(id);
    const res = await fetch("/api/enquiries", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    const updated = await res.json();
    setBusyId(null);
    if (res.ok) setEnquiries((es) => es.map((e) => (e.id === id ? updated : e)));
  };

  const remove = async (id) => {
    if (!confirm("Delete this enquiry? This cannot be undone.")) return;
    await fetch("/api/enquiries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEnquiries((es) => es.filter((e) => e.id !== id));
  };

  const counts = STATUSES.map((s) => ({
    ...s,
    n: enquiries.filter((e) => e.status === s.key).length,
  }));

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Bulk Enquiries ({enquiries.length})</h2>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${filter === "all" ? styles.tabActive : ""}`}
          onClick={() => setFilter("all")}
        >
          All <span className={styles.tabBadge}>{enquiries.length}</span>
        </button>
        {counts.map((s) => (
          <button
            key={s.key}
            className={`${styles.tab} ${filter === s.key ? styles.tabActive : ""}`}
            onClick={() => setFilter(s.key)}
          >
            {s.label} <span className={styles.tabBadge}>{s.n}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className={styles.emptyMsg}>
          {enquiries.length === 0
            ? "No enquiries yet. They'll appear here when customers submit the bulk purchase form."
            : "Nothing in this list."}
        </p>
      ) : (
        <div className={styles.list}>
          {shown.map((e) => (
            <div key={e.id} className={`${styles.listItem} ${styles.enquiryItem}`}>
              <div className={styles.listInfo}>
                <strong>
                  {e.name} — {e.productName || "General enquiry"}
                  <em className={styles[`status_${e.status}`]}>{e.status}</em>
                </strong>
                <span className={styles.enquiryMeta}>
                  📞 {e.phone}
                  {e.email && <> · ✉️ {e.email}</>}
                  {e.deliveryLocation && <> · 📍 {e.deliveryLocation}</>}
                </span>
                <span className={styles.enquiryMeta}>
                  {e.quantity && <>Qty: <b>{e.quantity}</b> · </>}
                  {e.priceDemand && <>Price demand: <b>₹{e.priceDemand}</b> · </>}
                  {new Date(e.createdAt).toLocaleString("en-IN")}
                </span>
                {e.message && <span className={styles.enquiryMsg}>&ldquo;{e.message}&rdquo;</span>}
              </div>

              <div className={styles.enquiryActions}>
                <select
                  value={e.status}
                  disabled={busyId === e.id}
                  onChange={(ev) => patch(e.id, { status: ev.target.value })}
                  className={styles.statusSelect}
                >
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <a className={styles.ghostBtn} href={`tel:${e.phone}`}>Call</a>
                <a
                  className={styles.ghostBtn}
                  href={`https://wa.me/${waNumber(e.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
                <button className={styles.dangerBtn} onClick={() => remove(e.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
