"use client";

import { useState } from "react";
import Link from "next/link";
import { FaAmazon, FaWhatsapp } from "react-icons/fa";
import { MdStorefront, MdShoppingBag } from "react-icons/md";
import { formatPrice } from "@/lib/format";
import EnquiryModal from "@/components/products/EnquiryModal";
import styles from "@/styles/sections/ProductView.module.css";

export default function ProductView({ product, category, settings }) {
  const media = product.media || [];
  const [active, setActive] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const current = media[active];
  const galleryRest = media.slice(1);

  const waText = encodeURIComponent(
    `Hi! I want a bulk enquiry for "${product.name}" (${formatPrice(product)}). Please share details.`
  );
  const waLink = `https://wa.me/${settings.whatsappNumber}?text=${waText}`;

  const specs = Object.entries(product.attributes || {}).filter(([, v]) => v);

  const marketplaces = [
    { key: "amazon", label: "Amazon", icon: <FaAmazon />, url: product.marketplace?.amazon },
    { key: "flipkart", label: "Flipkart", icon: <MdShoppingBag />, url: product.marketplace?.flipkart },
    { key: "meesho", label: "Meesho", icon: <MdStorefront />, url: product.marketplace?.meesho },
  ].filter((m) => m.url);

  return (
    <section className={styles.section}>
      <nav className={styles.crumbs}>
        <Link href="/">Home</Link> <span>/</span>{" "}
        <Link href="/products">Products</Link>
        {category && (
          <>
            {" "}<span>/</span>{" "}
            <Link href={`/products?category=${category.id}`}>{category.name}</Link>
          </>
        )}
      </nav>

      {/* ── Top: media + core details ── */}
      <div className={styles.top}>
        <div className={styles.mediaCol}>
          <div className={styles.mainMedia}>
            {current?.type === "video" ? (
              <video key={current.url} src={current.url} controls playsInline className={styles.mainImg} />
            ) : current ? (
              <img src={current.url} alt={product.name} className={styles.mainImg} />
            ) : (
              <div className={styles.noMedia}>No media</div>
            )}
          </div>
          {media.length > 1 && (
            <div className={styles.thumbs}>
              {media.map((m, i) => (
                <button
                  key={m.url + i}
                  className={`${styles.thumb} ${i === active ? styles.thumbActive : ""}`}
                  onClick={() => setActive(i)}
                >
                  {m.type === "video" ? (
                    <span className={styles.thumbVideo}>▶</span>
                  ) : (
                    <img src={m.url} alt="" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.details}>
          {category && <p className={styles.catLabel}>{category.name}{product.subcategory ? ` · ${product.subcategory}` : ""}</p>}
          <h1 className={styles.name}>{product.name}</h1>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(product)}</span>
            <span className={styles.priceType}>
              {product.pricingType === "range" ? "Price Range" : "Fixed Price"}
            </span>
          </div>

          <p className={styles.summary}>{product.summary}</p>

          {specs.length > 0 && (
            <dl className={styles.specs}>
              {specs.map(([label, value]) => (
                <div key={label} className={styles.specRow}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className={styles.enquiryBox}>
            {(settings.enquiryMode === "form" || settings.enquiryMode === "both") && (
              <button className="pillBtn pillBtn--solid" onClick={() => setEnquiryOpen(true)}>
                Enquiry — For Bulk Purchase
              </button>
            )}
            {(settings.enquiryMode === "whatsapp" || settings.enquiryMode === "both") && settings.whatsappNumber && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className={`pillBtn ${styles.waBtn}`}>
                <FaWhatsapp /> WhatsApp
              </a>
            )}
          </div>

          {marketplaces.length > 0 && (
            <div className={styles.marketBox}>
              <p className={styles.marketLabel}>Also available on</p>
              <div className={styles.marketRow}>
                {marketplaces.map((m) => (
                  <a
                    key={m.key}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.marketBtn}
                  >
                    {m.icon} {m.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom: full description + remaining gallery ── */}
      <div className={styles.bottom}>
        <h2 className={styles.bottomTitle}>Product Details</h2>
        <div className={styles.description}>
          {product.description.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        {galleryRest.length > 0 && (
          <div className={styles.gallery}>
            {galleryRest.map((m, i) => (
              <div key={m.url + i} className={styles.galleryItem}>
                {m.type === "video" ? (
                  <video src={m.url} controls playsInline />
                ) : (
                  <img src={m.url} alt={`${product.name} ${i + 2}`} loading="lazy" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {enquiryOpen && (
        <EnquiryModal product={product} settings={settings} onClose={() => setEnquiryOpen(false)} />
      )}
    </section>
  );
}
