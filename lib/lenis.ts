"use client";
import Lenis from "lenis";
import { gsap } from "gsap";
import { prefersReducedMotion } from "./gsap";

let stop: (() => void) | null = null;
let lenis: Lenis | null = null;
let refs = 0;

/** Lenis synced to GSAP's ticker (Emotion-style virtual scroll feel). No-op for reduced motion.
 *  Reference-counted so the home hero and a case page can share one instance. */
export function initLenis(): () => void {
  if (typeof window === "undefined" || prefersReducedMotion()) return () => {};
  refs++;
  if (!stop) {
    lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });
    const raf = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    stop = () => {
      gsap.ticker.remove(raf);
      lenis?.destroy();
      lenis = null;
      stop = null;
    };
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    refs = Math.max(0, refs - 1);
    if (refs === 0) stop?.();
  };
}

/** instant jump that keeps Lenis and ScrollTrigger in sync */
export function jumpTo(y: number): void {
  if (typeof window === "undefined") return;
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
}
