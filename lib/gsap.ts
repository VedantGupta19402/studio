"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** idempotent GSAP + ScrollTrigger registration */
export function registerGsap() {
  if (registered || typeof window === "undefined") return { gsap, ScrollTrigger };
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
  return { gsap, ScrollTrigger };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
