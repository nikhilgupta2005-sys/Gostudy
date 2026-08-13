"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaInstagram, FaFacebookF, FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import styles from "@/styles/ui/Navbar.module.css";

export default function Navbar({ settings, categories }) {
  const [open, setOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  const go = (href) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <header className={styles.header}>
        <button
          className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ""}`}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>

        <Link href="/" className={styles.logo}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.siteName} className={styles.logoImg} />
          ) : (
            <span className={styles.logoText}>{settings.siteName}</span>
          )}
        </Link>
      </header>

      <div className={`${styles.overlay} ${open ? styles.overlayVisible : ""}`} onClick={() => setOpen(false)} />

      <aside className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}>
        {settings.logoUrl && (
          <div className={styles.drawerLogo}>
            <img src={settings.logoUrl} alt={settings.siteName} />
          </div>
        )}
        <div className={styles.drawerHead}>MENU</div>

        <nav className={styles.drawerNav}>
          <Link href="/" className={styles.drawerLink} onClick={() => setOpen(false)}>Home</Link>

          <button className={styles.drawerLink} onClick={() => setCatsOpen(!catsOpen)}>
            Categories <span className={styles.chev}>{catsOpen ? "−" : "+"}</span>
          </button>
          <div className={`${styles.catList} ${catsOpen ? styles.catListOpen : ""}`}>
            <div className={styles.catInner}>
              <button className={styles.catLink} onClick={() => go("/products")}>
                All Products
              </button>
              {categories.map((c) => (
                <button key={c.id} className={styles.catLink} onClick={() => go(`/products?category=${c.id}`)}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <Link href="/#contact" className={styles.drawerLink} onClick={() => setOpen(false)}>Contact Us</Link>
        </nav>

        <div className={styles.drawerFoot}>
          {settings.contactPhone && (
            <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`} className={styles.footLink}>
              <FaPhoneAlt /> {settings.contactPhone}
            </a>
          )}
          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`} className={styles.footLink}>
              {settings.contactEmail}
            </a>
          )}
          <div className={styles.socialRow}>
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer"
                 className={styles.socialBtn} aria-label="Instagram"><FaInstagram /></a>
            )}
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer"
                 className={styles.socialBtn} aria-label="Facebook"><FaFacebookF /></a>
            )}
            {settings.whatsappNumber && (
              <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer"
                 className={styles.socialBtn} aria-label="WhatsApp"><FaWhatsapp /></a>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
