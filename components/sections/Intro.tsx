"use client";
// Document section after the world — statement with word-by-word violet highlight (scrub),
// services list right. Emotion "HomeMainContent" grammar, Opera copy.
import { useEffect, useRef } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { INTRO } from "@/content/opera";

export default function Intro() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    const el = ref.current!;
    const words = el.querySelectorAll("[data-word]");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { color: "rgba(245,239,255,0.28)" },
        {
          color: "#F5EFFF",
          stagger: 0.06,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 72%", end: "top 22%", scrub: true },
        },
      );
      gsap.fromTo(
        el.querySelectorAll("[data-rise]"),
        { y: 48, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 70%" },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="about-intro" className="hairline-t bg-[color:var(--ink)] px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p data-rise className="mono-label mb-8 inline-block rounded-full border border-[color:var(--hairline)] px-4 py-2 text-[color:var(--violet-2)]">
            {INTRO.kicker}
          </p>
          <p className="display text-[clamp(1.7rem,3.4vw,3.1rem)] leading-[1.15] text-[color:var(--paper)]">
            {INTRO.statement.split(" ").map((w, i) => (
              <span key={i} data-word className="inline-block whitespace-pre">
                {w + " "}
              </span>
            ))}
          </p>
        </div>
        <div data-rise>
          <p className="mono-label mb-6 text-[color:var(--muted)]">{INTRO.servicesLabel}</p>
          <ul className="space-y-0">
            {INTRO.services.map((s) => (
              <li key={s} className="hairline-t py-3 font-mono text-sm tracking-wide text-[color:var(--muted)] transition-colors hover:text-[color:var(--paper)]">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
