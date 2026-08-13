"use client";

import { useState } from "react";
import { uploadFile } from "@/components/admin/uploadFile";
import styles from "@/styles/sections/Admin.module.css";

export default function CmsTab({ settings, setSettings }) {
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testAlert = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/enquiries/test-alert", { method: "POST" });
      setTestResult(await res.json());
    } catch (err) {
      setTestResult({ sent: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  const setStat = (i, k, v) =>
    setForm((f) => {
      const stats = f.stats.map((s, idx) => (idx === i ? { ...s, [k]: k === "value" ? Number(v) || 0 : v } : s));
      return { ...f, stats };
    });

  const onMedia = async (e, key, typeKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url, type } = await uploadFile(file);
      setForm((f) => ({ ...f, [key]: url, ...(typeKey ? { [typeKey]: type } : {}) }));
      setSaved(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSettings(data.settings);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Home Page & Site Settings</h2>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.f}>
          <span>Site Name (fallback if no logo)</span>
          <input value={form.siteName} onChange={(e) => set("siteName", e.target.value)} />
        </label>

        <label className={styles.f}>
          <span>Tagline</span>
          <input value={form.tagline || ""} onChange={(e) => set("tagline", e.target.value)} placeholder="Learn • Erase • Repeat" />
        </label>

        <div className={styles.f}>
          <span>Logo Image (optional — replaces text logo)</span>
          <div className={styles.inlineUpload}>
            {form.logoUrl && <img src={form.logoUrl} alt="logo" className={styles.logoPreview} />}
            <label className={styles.uploadBoxSm}>
              {busy ? "…" : form.logoUrl ? "Replace" : "+ Upload"}
              <input type="file" hidden accept="image/*" onChange={(e) => onMedia(e, "logoUrl")} />
            </label>
            {form.logoUrl && (
              <button className={styles.ghostBtn} onClick={() => set("logoUrl", "")}>Remove</button>
            )}
          </div>
        </div>

        <label className={`${styles.f} ${styles.fWide}`}>
          <span>Hero Title (landing page text)</span>
          <input value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
        </label>

        <label className={`${styles.f} ${styles.fWide}`}>
          <span>Hero Introductory Text</span>
          <textarea rows={3} value={form.heroText} onChange={(e) => set("heroText", e.target.value)} />
        </label>

        <div className={`${styles.f} ${styles.fWide}`}>
          <span>Promotional Media (image or video below hero)</span>
          <div className={styles.inlineUpload}>
            {form.promoMediaUrl && (
              form.promoMediaType === "video" ? (
                <video src={form.promoMediaUrl} className={styles.promoPreview} muted />
              ) : (
                <img src={form.promoMediaUrl} alt="promo" className={styles.promoPreview} />
              )
            )}
            <label className={styles.uploadBoxSm}>
              {busy ? "…" : "Replace"}
              <input type="file" hidden accept="image/*,video/mp4,video/webm" onChange={(e) => onMedia(e, "promoMediaUrl", "promoMediaType")} />
            </label>
          </div>
        </div>

        <div className={`${styles.f} ${styles.fWide}`}>
          <span>Statistics Counters (3 shown on home page)</span>
          <div className={styles.statsGrid}>
            {form.stats.map((s, i) => (
              <div key={i} className={styles.statCard}>
                <input value={s.label} onChange={(e) => setStat(i, "label", e.target.value)} placeholder="Label" />
                <div className={styles.statNums}>
                  <input type="number" value={s.value} onChange={(e) => setStat(i, "value", e.target.value)} placeholder="Value" />
                  <input value={s.suffix} onChange={(e) => setStat(i, "suffix", e.target.value)} placeholder="+" className={styles.suffixInput} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className={styles.f}>
          <span>Enquiry Button Behaviour</span>
          <select value={form.enquiryMode} onChange={(e) => set("enquiryMode", e.target.value)}>
            <option value="form">Form only (saved to dashboard)</option>
            <option value="whatsapp">WhatsApp redirect only</option>
            <option value="both">Both — form + WhatsApp option</option>
          </select>
        </label>

        <label className={styles.f}>
          <span>WhatsApp Number (with country code, digits only)</span>
          <input value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} placeholder="919999999999" />
        </label>

        <div className={`${styles.f} ${styles.fWide}`}>
          <span>Enquiry Email Alerts</span>
          <div className={styles.alertBox}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={form.enquiryAlertsEnabled !== false}
                onChange={(e) => set("enquiryAlertsEnabled", e.target.checked)}
              />
              <span>Email me every time someone submits a bulk enquiry</span>
            </label>

            <label className={styles.f}>
              <span>Send alerts to (blank = Contact Email above)</span>
              <input
                value={form.enquiryAlertEmail || ""}
                onChange={(e) => set("enquiryAlertEmail", e.target.value)}
                placeholder={form.contactEmail || "orders@gostudy.in"}
              />
            </label>

            <div className={styles.alertActions}>
              <button type="button" className={styles.ghostBtn} onClick={testAlert} disabled={testing}>
                {testing ? "Sending…" : "Send test email"}
              </button>
              {testResult && (
                <span className={testResult.sent ? styles.savedMsg : styles.errorMsg}>
                  {testResult.sent
                    ? `✓ Sent to ${testResult.to} via ${testResult.driver}`
                    : testResult.error || testResult.reason}
                </span>
              )}
            </div>
            <p className={styles.hint}>
              Save your changes first — the test uses the saved settings. Sending needs an email
              provider configured on the server (Resend or Brevo); until then alerts are only
              written to the server log.
            </p>
          </div>
        </div>

        <label className={styles.f}>
          <span>Contact Email</span>
          <input value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </label>

        <label className={styles.f}>
          <span>Contact Phone</span>
          <input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
        </label>

        <label className={styles.f}>
          <span>Instagram Handle</span>
          <input value={form.instagramHandle || ""} onChange={(e) => set("instagramHandle", e.target.value)} placeholder="@gostudy.bharat" />
        </label>

        <label className={styles.f}>
          <span>Instagram URL</span>
          <input value={form.instagramUrl || ""} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/…" />
        </label>

        <label className={styles.f}>
          <span>Facebook Name</span>
          <input value={form.facebookHandle || ""} onChange={(e) => set("facebookHandle", e.target.value)} placeholder="GoStudy India" />
        </label>

        <label className={styles.f}>
          <span>Facebook URL</span>
          <input value={form.facebookUrl || ""} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/…" />
        </label>

        <label className={styles.f}>
          <span>Registered / Legal Name</span>
          <input value={form.legalName || ""} onChange={(e) => set("legalName", e.target.value)} placeholder="Bansal Trading Company" />
        </label>

        <label className={styles.f}>
          <span>GST Number</span>
          <input value={form.gst || ""} onChange={(e) => set("gst", e.target.value)} />
        </label>

        <label className={`${styles.f} ${styles.fWide}`}>
          <span>Address</span>
          <input value={form.contactAddress} onChange={(e) => set("contactAddress", e.target.value)} />
        </label>

        <label className={`${styles.f} ${styles.fWide}`}>
          <span>Google Maps Link (address becomes clickable)</span>
          <input value={form.mapsLink || ""} onChange={(e) => set("mapsLink", e.target.value)} placeholder="https://maps.app.goo.gl/…" />
        </label>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}
      {saved && <p className={styles.savedMsg}>✓ Saved — changes are live.</p>}

      <div className={styles.panelActions}>
        <button className="pillBtn pillBtn--solid" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
