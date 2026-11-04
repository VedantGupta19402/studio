"use client";
import Lenis from "lenis";
import { gsap } from "gsap";
import { prefersReducedMotion } from "./gsap";

let stop: (() => void) | null = null;

/** Lenis synced to GSAP's ticker (Emotion-style virtual scroll feel). No-op for reduced motion. */
export function initLenis(): () => void {
  if (stop || typeof window === "undefined" || prefersReducedMotion()) return () => {};
  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.4,
  });
  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  stop = () => {
    gsap.ticker.remove(raf);
    lenis.destroy();
    stop = null;
  };
  return stop;
}
