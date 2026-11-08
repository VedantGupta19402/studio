"use client";
// Team — three monogram cards (portraits pending), real names, real links where they exist.
import { useEffect, useRef } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { TEAM } from "@/content/opera";

export default function Team() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    const el = ref.current!;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-member]"),
        { y: 56, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: el, start: "top 72%" },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="team" className="hairline-t bg-[color:var(--ink)] px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <h2 className="display text-[clamp(2.4rem,5.6vw,5rem)] leading-[1.02] text-[color:var(--paper)]">
            Different expertise.{" "}
            <span className="block italic text-[color:var(--violet-2)]">Shared ambition.</span>
          </h2>
          <p className="mono-label max-w-xs leading-loose text-[color:var(--muted)]">
            PRODUCT · ENGINEERING · OUTREACH — END TO END, OUTREACH TO DEPLOY.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TEAM.map((m, i) => (
            <article
              key={m.id}
              data-member
              className="group relative overflow-hidden rounded-3xl border border-[color:var(--hairline)] bg-[color:var(--ink-2)] p-6 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[color:var(--violet-2)]"
            >
              <span
                aria-hidden="true"
                className="display pointer-events-none absolute right-5 top-2 text-6xl leading-none text-[color:var(--paper)]/[0.06] transition-colors duration-300 group-hover:text-[color:var(--violet-2)]/25"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* monogram tile — placeholder until portraits land */}
              <div
                className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--hairline)]"
                style={{
                  background:
                    "radial-gradient(120% 110% at 22% 0%, rgba(181,123,255,0.26) 0%, #171226 55%, #0F0D1A 100%)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#F5EFFF_1px,transparent_1px),linear-gradient(to_bottom,#F5EFFF_1px,transparent_1px)] [background-size:42px_42px]"
                />
                <span className="display relative text-[6rem] leading-none text-[color:var(--paper)] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]">
                  {m.monogram}
                </span>
                <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[color:var(--violet-2)] opacity-70 shadow-[0_0_16px_rgba(181,123,255,0.9)]" />
                <span className="mono-label absolute bottom-4 left-4 text-[color:var(--paper)]/50">
                  {String(i + 1).padStart(2, "0")} / 03
                </span>
              </div>

              <h3 className="display relative mt-6 text-2xl text-[color:var(--paper)]">{m.name}</h3>
              <p className="mono-label mt-1 text-[color:var(--violet-2)]">{m.role}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {m.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[color:var(--hairline)] px-3 py-1 font-mono text-[0.65rem] tracking-widest text-[color:var(--muted)] transition-colors duration-200 group-hover:border-[color:var(--muted)]/40 group-hover:text-[color:var(--paper)]/80"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mono-label mt-6 flex gap-5">
                {m.github ? (
                  <a href={m.github} target="_blank" rel="noopener" className="text-[color:var(--muted)] transition-colors hover:text-[color:var(--paper)]">
                    GitHub ↗
                  </a>
                ) : null}
                {m.linkedin && !m.linkedin.includes("PLACEHOLDER") ? (
                  <a href={m.linkedin} target="_blank" rel="noopener" className="text-[color:var(--muted)] transition-colors hover:text-[color:var(--paper)]">
                    LinkedIn ↗
                  </a>
                ) : (
                  <span className="text-[color:var(--muted)]/60">LinkedIn — soon</span>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-5 border-t border-[color:var(--hairline)] pt-8 md:flex-row md:items-center">
          <p className="mono-label text-[color:var(--muted)]">THE SAME THREE PEOPLE, FROM FIRST CALL TO RELEASE</p>
          <a
            href="#contact"
            className="mono-label group inline-flex items-center gap-2 rounded-full border border-[color:var(--hairline)] px-5 py-3 text-[color:var(--paper)] transition-colors duration-200 hover:border-[color:var(--violet-2)]"
          >
            WORK WITH THE STUDIO
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              ↗
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
