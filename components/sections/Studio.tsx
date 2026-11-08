"use client";
// Studio/About — Emotion's dark statement-scene grammar (kicker → giant statement),
// Hamol's dark→light rhythm. The statement sticks while the capability index scrolls
// past it, then a quiet marquee of the six services we actually take on.
import { useEffect, useRef } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { STUDIO, INTRO } from "@/content/opera";

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
          scrollTrigger: { trigger: el.querySelector("[data-pillars]")!, start: "top 78%" },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="studio" className="hairline-t bg-[color:var(--ink-2)] px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 md:grid-cols-[0.95fr_1.05fr] md:gap-20">
          <div className="md:sticky md:top-28 md:self-start">
            <p className="mono-label mb-10 text-[color:var(--violet-2)]">{STUDIO.kicker}</p>

            <h2 data-statement className="display text-[clamp(2.4rem,5.4vw,5rem)] leading-[1.02] text-[color:var(--paper)]">
              {STUDIO.statement1.lead}{" "}
              <span className="italic text-[color:var(--violet-2)]">{STUDIO.statement1.caps}</span>
            </h2>

            <p data-statement className="mt-10 max-w-md text-base leading-relaxed text-[color:var(--muted)]">
              {STUDIO.paragraph}
            </p>
          </div>

          <div data-pillars className="md:pt-3">
            {STUDIO.pillars.map((p) => (
              <article
                key={p.index}
                data-pillar
                tabIndex={0}
                className="group border-t border-[color:var(--hairline)] outline-none transition-colors duration-300 focus-visible:border-[color:var(--violet-2)] last:border-b"
              >
                <div className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-7 md:grid-cols-[3rem_1fr_auto] md:py-9">
                  <span className="font-mono text-xs text-[color:var(--muted)] transition-colors duration-300 group-hover:text-[color:var(--violet-2)] group-focus-visible:text-[color:var(--violet-2)]">
                    {p.index}
                  </span>
                  <h3 className="display text-[clamp(1.6rem,2.6vw,2.4rem)] leading-none text-[color:var(--paper)]">{p.name}</h3>
                  <span className="text-[color:var(--muted)] transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-[color:var(--violet-2)] group-focus-visible:text-[color:var(--violet-2)]">
                    ↗
                  </span>
                </div>
                {/* the one-line detail is open on touch and keyboard, and unfolds on desktop hover */}
                <div className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] md:group-focus-visible:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <p className="max-w-sm pb-7 text-sm leading-relaxed text-[color:var(--muted)] md:opacity-70 md:transition-opacity md:duration-300 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
                      {p.line}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* the six things we take on — a quiet, seamless marquee */}
      <div className="relative mt-24 overflow-hidden border-y border-[color:var(--hairline)] py-5 md:mt-32">
        <div className="svc-marquee flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 gap-10 pr-10">
              {INTRO.services.map((s) => (
                <li key={s} className="mono-label flex items-center gap-10 whitespace-nowrap text-[color:var(--muted)]">
                  {s}
                  <span className="text-[color:var(--violet-2)]" aria-hidden="true">✳</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
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
