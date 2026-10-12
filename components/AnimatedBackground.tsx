"use client";

import { useEffect, useRef } from "react";

/**
 * Themed animated background: slowly drifting indigo/violet/blue gradient orbs,
 * plus a soft glow that follows the mouse. Pure CSS animation + CSS-var updates
 * (no React re-renders) so it stays smooth. Sits behind page content.
 */
export function AnimatedBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${e.clientX}px`);
        el.style.setProperty("--my", `${e.clientY}px`);
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="qp-bg" aria-hidden>
      <div className="qp-orb qp-orb1" />
      <div className="qp-orb qp-orb2" />
      <div className="qp-orb qp-orb3" />
      <div className="qp-bg-spotlight" />
      <div className="qp-bg-grid" />
    </div>
  );
}
