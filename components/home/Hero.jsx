"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import styles from "@/styles/sections/Hero.module.css";

export default function Hero({ settings }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        `.${styles.title}`,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", delay: 0.15 }
      );
      gsap.fromTo(
        `.${styles.text}`,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.4 }
      );
      gsap.fromTo(
        `.${styles.cta}`,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.6 }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className={styles.hero}>
      <div className={styles.inner}>
        {settings.tagline && <p className={styles.kicker}>{settings.tagline}</p>}
        <h1 className={styles.title}>{settings.heroTitle}</h1>
        <p className={styles.text}>{settings.heroText}</p>
        <div className={styles.cta}>
          <Link href="/products" className="pillBtn pillBtn--solid">
            Explore Products →
          </Link>
        </div>
      </div>
      <div className={styles.fade} />
    </section>
  );
}
