import Link from "next/link";
import { FaInstagram, FaFacebookF, FaWhatsapp, FaPhoneAlt, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";
import styles from "@/styles/ui/Footer.module.css";

export default function Footer({ settings }) {
  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.inner}>
        {/* ── Brand ── */}
        <div className={styles.brand}>
          {settings.logoUrl ? (
            <div className={styles.logoCard}>
              <img src={settings.logoUrl} alt={settings.siteName} />
            </div>
          ) : (
            <span className={styles.logoText}>{settings.siteName}</span>
          )}
          {settings.tagline && <p className={styles.tagline}>{settings.tagline}</p>}
          <p className={styles.tag}>
            Boards, slates, dustless chalk, study tables and classic wooden games — for schools,
            homes and bulk buyers across India.
          </p>
          {settings.gst && (
            <p className={styles.gst}>
              <strong>GST</strong> {settings.gst}
            </p>
          )}
        </div>

        {/* ── Contact ── */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Contact Us</h4>

          {settings.contactPhone && (
            <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`} className={styles.link}>
              <FaPhoneAlt className={styles.ico} /> {settings.contactPhone}
            </a>
          )}
          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`} className={styles.link}>
              <FaEnvelope className={styles.ico} /> {settings.contactEmail}
            </a>
          )}
          {settings.instagramUrl && (
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
              <FaInstagram className={styles.ico} /> {settings.instagramHandle || "Instagram"}
            </a>
          )}
          {settings.facebookUrl && (
            <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
              <FaFacebookF className={styles.ico} /> {settings.facebookHandle || "Facebook"}
            </a>
          )}
          {settings.whatsappNumber && (
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <FaWhatsapp className={styles.ico} /> WhatsApp Us
            </a>
          )}
        </div>

        {/* ── Visit / links ── */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Visit Us</h4>
          {settings.contactAddress && (
            settings.mapsLink ? (
              <a href={settings.mapsLink} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                <FaMapMarkerAlt className={styles.ico} />
                <span>{settings.contactAddress}</span>
              </a>
            ) : (
              <p className={styles.muted}>{settings.contactAddress}</p>
            )
          )}

          <h4 className={`${styles.colTitle} ${styles.colTitleSpaced}`}>Quick Links</h4>
          <Link href="/" className={styles.link}>Home</Link>
          <Link href="/products" className={styles.link}>All Products</Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>
          © {new Date().getFullYear()} {settings.legalName || settings.siteName}. All rights reserved.
        </span>
        <Link href="/admin/login" className={styles.adminLink}>Admin Login</Link>
      </div>
    </footer>
  );
}
