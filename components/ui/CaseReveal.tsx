"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/gsap";

export default function CaseReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    const el = ref.current!;
    const ctx = gsap.context(() => {
      gsap.from("[data-reveal]", {
        y: 26,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        clearProps: "all",
      });
      gsap.from("[data-reveal-media]", {
        opacity: 0,
        scale: 1.03,
        duration: 1.1,
        ease: "power3.out",
        clearProps: "all",
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal-scroll]").forEach((node) => {
        gsap.from(node, {
          y: 32,
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: { trigger: node, start: "top 86%" },
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return <div ref={ref}>{children}</div>;
}
