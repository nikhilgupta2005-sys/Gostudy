"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import styles from "@/styles/sections/Counters.module.css";

export default function Counters({ stats }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const nums = gsap.utils.toArray(`.${styles.value}`);
      nums.forEach((el) => {
        const target = Number(el.dataset.value) || 0;
        const obj = { n: 0 };
        // The real figure is server-rendered so it survives without JS; only
        // reset it to zero once we know the count-up is actually going to run.
        el.firstChild.textContent = "0";
        gsap.to(obj, {
          n: target,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
          onUpdate: () => {
            el.firstChild.textContent = Math.round(obj.n).toLocaleString("en-IN");
          },
        });
      });
      gsap.fromTo(
        `.${styles.card}`,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 85%" },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className={styles.section}>
      <div className={styles.grid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.card}>
            <div className={styles.value} data-value={s.value}>
              <span>{Number(s.value).toLocaleString("en-IN")}</span>
              <em>{s.suffix}</em>
            </div>
            <div className={styles.label}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
