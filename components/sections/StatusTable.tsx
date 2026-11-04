"use client";
// Status table in the awards-table rhythm — real products, real statuses. No invented trust.
import { useEffect, useRef } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { STATUS_ROWS } from "@/content/opera";

export default function StatusTable() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap, ScrollTrigger } = registerGsap();
    const el = ref.current!;
    gsap.fromTo(
      el.querySelectorAll("[data-row]"),
      { y: 28, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.06,
        scrollTrigger: { trigger: el, start: "top 72%" },
      },
    );
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  return (
    <section ref={ref} id="products" className="hairline-t bg-[color:var(--ink)] px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-[clamp(1.8rem,3.6vw,3rem)] text-[color:var(--paper)]">
            Products <span className="italic text-[color:var(--violet-2)]">&amp;</span> builds
          </h2>
          <p className="mono-label text-[color:var(--muted)]">FIVE THINGS WE RUN — NOT FOURTEEN LOGOS</p>
        </div>
        <ul>
          {STATUS_ROWS.map((r, i) => (
            <li key={r.name} data-row className="hairline-t">
              <a
                href={r.url ?? "#"}
                target={r.url?.startsWith("http") ? "_blank" : undefined}
                rel="noopener"
                className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-5 transition-colors duration-200 hover:bg-[color:var(--paper)] md:grid-cols-[3.5rem_2fr_1.4fr_auto_auto] md:px-4"
              >
                <span className="font-mono text-sm text-[color:var(--muted)] group-hover:text-[color:var(--ink)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="display text-xl text-[color:var(--paper)] group-hover:text-[color:var(--ink)] md:text-2xl">
                  {r.name}
                </span>
                <span className="mono-label hidden text-[color:var(--muted)] group-hover:text-[color:var(--ink)] md:block">
                  {r.category}
                </span>
                <span
                  className={`mono-label flex items-center gap-2 ${
                    r.status === "LIVE" ? "text-[color:var(--ok)]" : "text-[color:var(--violet-2)]"
                  } group-hover:!text-[color:var(--ink)]`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      r.status === "LIVE" ? "bg-[color:var(--ok)]" : "bg-[color:var(--violet-2)]"
                    }`}
                  />
                  {r.status}
                </span>
                <span className="text-[color:var(--paper)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[color:var(--ink)]">↗</span>
              </a>
            </li>
          ))}
          <li className="hairline-t" />
        </ul>
      </div>
    </section>
  );
}
