"use client";
// "SOME Of our PRODUCTS" — Emotion projects-scatter grammar, dark theme, our products.
import { useEffect, useRef } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { PRODUCTS } from "@/content/opera";

// loose scatter offsets (desktop) — Emotion's grid is deliberately unaligned
const SCATTER = [
  "md:mt-0", "md:mt-24", "md:-mt-10", "md:mt-16", "md:-mt-4",
];

export default function Projects() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap, ScrollTrigger } = registerGsap();
    const el = ref.current!;
    gsap.fromTo(
      el.querySelectorAll("[data-card]"),
      { y: 72, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 68%" },
      },
    );
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  return (
    <section ref={ref} id="work" className="hairline-t bg-[color:var(--ink)] px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto max-w-7xl">
        <h2 className="display text-[clamp(2.6rem,6.5vw,5.8rem)] uppercase text-[color:var(--paper)]">
          Some <span className="italic lowercase text-[color:var(--violet-2)]">of our</span>{" "}
          <span className="ml-[12vw] inline-block md:ml-[22vw]">products</span>
        </h2>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <a
              key={p.id}
              data-card
              href={p.url ?? "#"}
              target={p.url?.startsWith("http") ? "_blank" : undefined}
              rel="noopener"
              className={`group block ${SCATTER[i % SCATTER.length]}`}
            >
              {/* thumbnail tile — original typographic art, violet glow */}
              <div
                className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--hairline)] transition-transform duration-300 group-hover:-translate-y-1"
                style={{
                  background: `radial-gradient(120% 120% at 30% 20%, ${p.hue}26 0%, #161224 55%, #0F0D1A 100%)`,
                }}
              >
                <span
                  className="display text-6xl md:text-7xl"
                  style={{ color: p.hue, textShadow: `0 0 42px ${p.hue}66` }}
                >
                  {p.monogram}
                </span>
                <span className="mono-label absolute left-4 top-4 text-[color:var(--muted)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`mono-label absolute right-4 top-4 flex items-center gap-1.5 ${
                    p.status === "LIVE" ? "text-[color:var(--ok)]" : "text-[color:var(--violet-2)]"
                  }`}
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      p.status === "LIVE" ? "bg-[color:var(--ok)]" : "bg-[color:var(--violet-2)]"
                    }`}
                  />
                  {p.status}
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <h3 className="display text-2xl text-[color:var(--paper)]">{p.name}</h3>
                <span className="text-[color:var(--muted)] transition-transform duration-200 group-hover:translate-x-1">↗</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">{p.blurb}</p>
              <p className="mono-label mt-3 text-[color:var(--muted)]">{p.category}</p>
            </a>
          ))}

          {/* filler tile → contact */}
          <a data-card href="#contact" className="group flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-[color:var(--hairline)] transition-colors hover:border-[color:var(--violet-2)] md:mt-24">
            <span className="mono-label text-center text-[color:var(--muted)] group-hover:text-[color:var(--paper)]">
              + MORE IN ORBIT
              <br />
              WE&apos;RE SHIPPING →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
