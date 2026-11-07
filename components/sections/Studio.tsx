"use client";
// Studio/About — Emotion's dark statement-scene grammar (kicker → giant statement),
// Hamol's dark→light rhythm. Our copy: "From possibility to a working business."
import { useEffect, useRef } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { STUDIO } from "@/content/opera";

export default function Studio() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    const el = ref.current!;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-statement]"),
        { y: 64, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1.0, ease: "power3.out", stagger: 0.12,
          scrollTrigger: { trigger: el, start: "top 70%" },
        },
      );
      gsap.fromTo(
        el.querySelectorAll("[data-pillar]"),
        { y: 36, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: el.querySelectorAll("[data-pillars]")[0], start: "top 78%" },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="studio" className="hairline-t bg-[color:var(--ink-2)] px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto max-w-7xl">
        <p className="mono-label mb-10 text-[color:var(--violet-2)]">{STUDIO.kicker}</p>

        <h2 data-statement className="display text-[clamp(2.6rem,6.8vw,6rem)] text-[color:var(--paper)]">
          {STUDIO.statement1.lead}{" "}
          <span className="italic text-[color:var(--violet-2)]">{STUDIO.statement1.caps}</span>
        </h2>

        <p data-statement className="mt-12 max-w-2xl text-lg leading-relaxed text-[color:var(--muted)]">
          {STUDIO.paragraph}
        </p>

        <div data-pillars className="mt-20 grid gap-px overflow-hidden rounded-xl border border-[color:var(--hairline)] bg-[color:var(--hairline)] md:grid-cols-3">
          {STUDIO.pillars.map((p) => (
            <div key={p.index} data-pillar className="group bg-[color:var(--ink-2)] p-8 transition-colors duration-300 hover:bg-[color:var(--ink)]">
              <p className="font-mono text-sm text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--violet-2)]">
                {p.index}
              </p>
              <h3 className="mono-label mt-6 text-[color:var(--paper)]">{p.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">{p.line}</p>
            </div>
          ))}
        </div>

        <div className="mt-28 space-y-6">
          <p data-statement className="display text-[clamp(1.9rem,4.4vw,3.6rem)] text-[color:var(--paper)]">
            {STUDIO.scene2.lead} <span className="italic text-[color:var(--violet-2)]">{STUDIO.scene2.caps}</span>
          </p>
          <p data-statement className="display text-[clamp(1.9rem,4.4vw,3.6rem)] text-[color:var(--paper)]">
            {STUDIO.scene3.lead} <span className="italic text-[color:var(--violet-2)]">{STUDIO.scene3.caps}</span>
          </p>
          <a data-statement href="#team" className="mono-label inline-block border-b border-[color:var(--violet-2)] pb-1 text-[color:var(--paper)]">
            Meet the team ↓
          </a>
        </div>
      </div>
    </section>
  );
}
