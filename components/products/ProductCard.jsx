"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import styles from "@/styles/ui/ProductCard.module.css";

export default function ProductCard({ product }) {
  const cover = product.media?.[0];
  const href = `/products/${product.id}`;

  return (
    <div className={styles.card}>
      <Link href={href} className={styles.mediaLink} aria-label={product.name}>
        {cover?.type === "video" ? (
          <video src={cover.url} muted playsInline className={styles.media} />
        ) : cover ? (
          <img src={cover.url} alt={product.name} className={styles.media} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>No image</div>
        )}
        {product.pricingType === "range" && <span className={styles.badge}>Price Range</span>}
      </Link>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.price}>{formatPrice(product)}</p>
        <Link href={href} className={styles.viewBtn}>
          View Product
        </Link>
      </div>
    </div>
  );
}
