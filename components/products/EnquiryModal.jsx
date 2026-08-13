"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { formatPrice } from "@/lib/format";
import styles from "@/styles/ui/EnquiryModal.module.css";

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  deliveryLocation: "",
  priceDemand: "",
  quantity: "",
  message: "",
};

export default function EnquiryModal({ product, settings, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  };

  const waText = encodeURIComponent(
    `Bulk enquiry — ${product.name} (${formatPrice(product)})\n` +
      `Name: ${form.name}\nPhone: ${form.phone}\nQuantity: ${form.quantity}\n` +
      `Deliver to: ${form.deliveryLocation}\nPrice demand: ${form.priceDemand}\n${form.message}`
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>

        {status === "done" ? (
          <div className={styles.done}>
            <div className={styles.doneIcon}>✓</div>
            <h3>Enquiry Sent!</h3>
            <p>We received your bulk enquiry for <strong>{product.name}</strong>. We&apos;ll get back to you soon.</p>
            {settings.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`pillBtn ${styles.waBtn}`}
              >
                <FaWhatsapp /> Also send on WhatsApp
              </a>
            )}
            <button className="pillBtn" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h3 className={styles.title}>Bulk Purchase Enquiry</h3>
            <p className={styles.sub}>{product.name} · {formatPrice(product)}</p>

            <form onSubmit={submit} className={styles.form}>
              <div className={styles.row2}>
                <label className={styles.field}>
                  <span>Name *</span>
                  <input required value={form.name} onChange={set("name")} placeholder="Your name" />
                </label>
                <label className={styles.field}>
                  <span>Phone *</span>
                  <input required type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 …" />
                </label>
              </div>
              <label className={styles.field}>
                <span>Email</span>
                <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
              </label>
              <label className={styles.field}>
                <span>Delivery Location</span>
                <input value={form.deliveryLocation} onChange={set("deliveryLocation")} placeholder="City / Pincode" />
              </label>
              <div className={styles.row2}>
                <label className={styles.field}>
                  <span>Quantity</span>
                  <input value={form.quantity} onChange={set("quantity")} placeholder="e.g. 500 pcs" />
                </label>
                <label className={styles.field}>
                  <span>Price Demand (₹)</span>
                  <input value={form.priceDemand} onChange={set("priceDemand")} placeholder="Your target price" />
                </label>
              </div>
              <label className={styles.field}>
                <span>Message</span>
                <textarea rows={3} value={form.message} onChange={set("message")} placeholder="Anything else…" />
              </label>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.actions}>
                <button type="submit" className="pillBtn pillBtn--solid" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Send Enquiry"}
                </button>
                {settings.whatsappNumber && (
                  <a
                    href={`https://wa.me/${settings.whatsappNumber}?text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`pillBtn ${styles.waBtn}`}
                  >
                    <FaWhatsapp /> WhatsApp instead
                  </a>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
