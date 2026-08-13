"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import styles from "@/styles/sections/PromoMedia.module.css";

export default function PromoMedia({ settings }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        `.${styles.frame}`,
        { y: 80, opacity: 0, scale: 0.96 },
        {
          y: 0, opacity: 1, scale: 1, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 80%" },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  if (!settings.promoMediaUrl) return null;

  return (
    <section ref={ref} className={styles.section}>
      <div className={styles.frame}>
        {settings.promoMediaType === "video" ? (
          <video src={settings.promoMediaUrl} controls playsInline className={styles.media} />
        ) : (
          <img src={settings.promoMediaUrl} alt="Promotional" className={styles.media} />
        )}
      </div>
    </section>
  );
}
