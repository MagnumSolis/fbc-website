"use client";
/* Site-wide motion, re-applied on every route change:
   - cards tilt toward the cursor (desktop only)
   - sections ease in as they scroll into view (public pages only)
   - numbers count up the first time they appear
   All of it is skipped for users who prefer reduced motion. */
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TILT_SEL = ".tilt, .tile, .compare > div, .how > div, .post, .person, .choice-opt, .stat, .col, .tl, .feature, .role, .cta-gold, .mock";
const REVEAL_SEL = ".sec-head, .statband, .compare, .bento, .how, .list.boxed, .feature, .cta-gold, .timeline, .cols, .grid.g2, .grid.g3, .post.featured";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Effects() {
  const path = usePathname();

  // tilt (one global listener)
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || reduced()) return;
    let current: HTMLElement | null = null;
    const reset = (el: HTMLElement) => { el.classList.remove("tilting"); el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest?.(TILT_SEL) as HTMLElement | null;
      if (current && current !== el) { reset(current); current = null; }
      if (!el) return;
      current = el;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      // bigger cards tilt less, so large panels stay calm
      const max = el.classList.contains("mock") ? 7 : Math.max(1.2, Math.min(6, 1700 / r.width));
      el.classList.add("tilt", "tilting");
      el.style.setProperty("--ry", ((x - 0.5) * 2 * max).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((0.5 - y) * 2 * max).toFixed(2) + "deg");
      el.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
      el.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    };
    const onLeave = () => { if (current) { reset(current); current = null; } };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); };
  }, []);

  // reveal + count-up, after each page renders (small delay lets client data load)
  useEffect(() => {
    if (!("IntersectionObserver" in window) || reduced()) return;
    let revealObs: IntersectionObserver | null = null, countObs: IntersectionObserver | null = null;
    const t = setTimeout(() => {
      const main = document.querySelector("main");
      if (!main) return;
      if (!main.querySelector(".shell")) {
        revealObs = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); revealObs!.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" });
        main.querySelectorAll<HTMLElement>(REVEAL_SEL).forEach((el) => {
          if (el.getBoundingClientRect().top < innerHeight || el.classList.contains("in")) return;
          el.classList.add("reveal"); revealObs!.observe(el);
        });
      }
      const run = (el: HTMLElement) => {
        const raw = el.textContent!.trim(), suffix = raw.endsWith("%") ? "%" : "";
        const end = Number(el.dataset.count ?? raw.replace(/[^\d]/g, ""));
        if (!end) return;
        const t0 = performance.now(), dur = end > 100 ? 1400 : 900;
        const tick = (tm: number) => {
          const k = Math.min(1, (tm - t0) / dur);
          el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString("en-IN") + suffix;
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      countObs = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { run(en.target as HTMLElement); countObs!.unobserve(en.target); } }), { threshold: 0.6 });
      main.querySelectorAll<HTMLElement>("[data-count], .stat > b")
        .forEach((el) => { if (/^\d[\d,]*%?$/.test(el.textContent!.trim()) && !el.querySelector("[data-count]") && !el.dataset.counted) { el.dataset.counted = "1"; countObs!.observe(el); } });
    }, 350);
    return () => { clearTimeout(t); revealObs?.disconnect(); countObs?.disconnect(); };
  }, [path]);

  return null;
}
