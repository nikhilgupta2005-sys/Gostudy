"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import ProductCard from "@/components/products/ProductCard";
import styles from "@/styles/sections/Featured.module.css";

export default function Featured({ products }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        `.${styles.item}`,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 80%" },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  if (!products.length) return null;

  return (
    <section ref={ref} className={styles.section}>
      <div className={styles.head}>
        <p className={styles.kicker}>Featured Collections</p>
        <h2 className={styles.title}>Highlighted Products</h2>
      </div>
      <div className={styles.grid}>
        {products.map((p) => (
          <div key={p.id} className={styles.item}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <div className={styles.cta}>
        <Link href="/products" className="pillBtn">
          Explore Products →
        </Link>
      </div>
    </section>
  );
}
