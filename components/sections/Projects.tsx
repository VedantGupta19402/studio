"use client";
// Selected work: one featured case, a 2x2 index, real covers. Emotion's editorial
// grid grammar with our own assets and copy. Clicking a case opens /projects/[id].
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { PRODUCTS, type Product } from "@/content/opera";

function trackSpotlight(e: ReactPointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function StatusPill({ status }: { status: Product["status"] }) {
  return (
    <span className="mono-label flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[color:var(--paper)]">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          status === "LIVE" ? "bg-[color:var(--ok)]" : "bg-[color:var(--violet-2)]"
        }`}
      />
      {status}
    </span>
  );
}

function CoverArt({ p }: { p: Product }) {
  return (
    <>
      <Image
        src={p.cover}
        alt={p.coverAlt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
        className="object-cover object-center grayscale transition-[filter,transform] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.025] group-hover:grayscale-0 group-focus-visible:grayscale-0"
      />
      {/* duotone at rest, full colour on hover */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-45 mix-blend-color transition-opacity duration-700 group-hover:opacity-0"
        style={{ backgroundColor: p.hue }}
      />
      {/* cursor spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), ${p.hue}30, transparent 68%)`,
        }}
      />
    </>
  );
}

function ProjectCard({ p, index }: { p: Product; index: number }) {
  return (
    <Link
      href={`/projects/${p.id}`}
      data-case-link
      data-case-label={p.name}
      data-work-card
      onPointerMove={trackSpotlight}
      className="work-card group block rounded-2xl focus-visible:outline-offset-8"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--ink-2)]">
        <CoverArt p={p} />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0b0913]/70 via-transparent to-transparent"
        />
        <span className="mono-label absolute bottom-4 right-4 hidden items-center gap-2 rounded-full border border-white/12 bg-[color:var(--ink)]/75 px-3 py-1.5 text-[color:var(--paper)] backdrop-blur-sm md:flex md:translate-y-1 md:opacity-0 md:transition-[opacity,transform] md:duration-300 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100">
          OPEN CASE <span aria-hidden="true">→</span>
        </span>
      </div>

      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="mono-label text-[color:var(--muted)]">
              {String(index).padStart(2, "0")}
            </span>
            <span className="mono-label text-[color:var(--muted)]">{p.category}</span>
          </div>
          <h3 className="display mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] text-[color:var(--paper)]">
            {p.name}
          </h3>
        </div>
        <span className="mono-label flex shrink-0 items-center gap-2 pt-1 text-[color:var(--muted)]">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              p.status === "LIVE" ? "bg-[color:var(--ok)]" : "bg-[color:var(--violet-2)]"
            }`}
          />
          {p.status}
        </span>
      </div>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--muted)]">{p.blurb}</p>
    </Link>
  );
}

export default function Projects() {
  const ref = useRef<HTMLElement>(null);
  const featured = PRODUCTS[0];
  const rest = PRODUCTS.slice(1);
  const live = PRODUCTS.filter((p) => p.status === "LIVE").length;
  const builds = PRODUCTS.length - live;
  const [preview, setPreview] = useState<Product | null>(null);
  const [canPreview, setCanPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanPreview(query.matches);
    const onChange = (event: MediaQueryListEvent) => setCanPreview(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const movePreview = (event: ReactPointerEvent<HTMLElement>) => {
    const element = previewRef.current;
    if (!element) return;
    const width = 280;
    const height = 200;
    const pad = 16;
    const x = Math.min(event.clientX + pad, window.innerWidth - width - pad);
    const y = Math.min(Math.max(event.clientY - height / 2, pad), window.innerHeight - height - pad);
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    const el = ref.current!;
    const ctx = gsap.context(() => {
      const hero = el.querySelector("[data-work-featured]");
      if (hero) {
        gsap.fromTo(
          hero,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: { trigger: hero, start: "top 84%" },
          },
        );
      }
      const grid = el.querySelector("[data-work-grid]");
      if (grid) {
        gsap.fromTo(
          grid.querySelectorAll("[data-work-card]"),
          { y: 48, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.09,
            clearProps: "opacity",
            scrollTrigger: { trigger: grid, start: "top 84%" },
          },
        );
      }
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      id="work"
      className="hairline-t bg-[color:var(--ink)] px-6 py-28 md:px-12 md:py-40"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-6">
          <p className="mono-label text-[color:var(--violet-2)]">01 / SELECTED WORK</p>
          <p className="mono-label text-right text-[color:var(--muted)]">
            {String(live).padStart(2, "0")} LIVE · {String(builds).padStart(2, "0")} BUILDS
          </p>
        </div>

        <h2 className="display mt-10 text-[clamp(3rem,8.5vw,7.4rem)] uppercase leading-[0.88] text-[color:var(--paper)]">
          Selected
          <span className="block pl-[12vw] italic lowercase text-[color:var(--violet-2)] md:pl-[26vw]">
            work
          </span>
        </h2>

        <p className="mt-9 max-w-lg text-sm leading-relaxed text-[color:var(--muted)] md:text-base">
          Five builds from the studio. Every one links to a live product, a public repo, or both.
        </p>

        {/* featured case */}
        <div data-work-featured className="mt-14 md:mt-20">
          <Link
            href={`/projects/${featured.id}`}
            data-case-link
            data-case-label={featured.name}
            className="group grid overflow-hidden rounded-3xl border border-[color:var(--hairline)] bg-[color:var(--ink-2)] focus-visible:outline-offset-8 lg:grid-cols-2"
          >
            <div className="flex flex-col p-7 md:p-10 lg:justify-between lg:p-12">
              <div className="flex items-center justify-between gap-4">
                <span className="mono-label text-[color:var(--violet-2)]">FEATURED CASE / 01</span>
                <StatusPill status={featured.status} />
              </div>

              <div className="mt-12 lg:mt-14">
                <p className="mono-label text-[color:var(--muted)]">{featured.category}</p>
                <h3 className="display mt-3 text-[clamp(2.8rem,5vw,4.6rem)] leading-[0.95] text-[color:var(--paper)]">
                  {featured.name}
                </h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[color:var(--paper)]/75 md:text-base">
                  {featured.blurb}
                </p>
              </div>

              <div className="mt-10 flex flex-col items-start gap-6 lg:mt-14">
                <ul className="flex flex-wrap gap-2">
                  {featured.stack.slice(0, 4).map((s) => (
                    <li
                      key={s}
                      className="mono-label rounded-full border border-white/12 px-3 py-1 text-[color:var(--paper)]/70"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
                <span className="mono-label flex items-center gap-2 rounded-full bg-[color:var(--paper)] px-5 py-3 text-[color:var(--ink)] transition-transform duration-300 group-hover:-translate-y-0.5">
                  OPEN CASE <span aria-hidden="true">→</span>
                </span>
              </div>
            </div>

            <div onPointerMove={trackSpotlight} className="relative aspect-[16/10] overflow-hidden border-t border-[color:var(--hairline)] lg:aspect-auto lg:min-h-[560px] lg:border-l lg:border-t-0">
              <Image
                src={featured.feature?.src ?? featured.cover}
                alt={featured.feature?.alt ?? featured.coverAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 750px"
                className="object-cover object-center grayscale transition-[filter,transform] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.015] group-hover:grayscale-0"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-35 mix-blend-color transition-opacity duration-700 group-hover:opacity-0"
                style={{ backgroundColor: featured.hue }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(620px circle at var(--mx, 50%) var(--my, 50%), ${featured.hue}38, transparent 70%)`,
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0913]/45 to-transparent lg:hidden"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 hidden w-28 bg-gradient-to-r from-[color:var(--ink-2)] to-transparent lg:block"
              />
            </div>
          </Link>
        </div>

        {/* index grid */}
        <div
          data-work-grid
          className="work-grid mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 md:mt-20 md:gap-y-20"
        >
          {rest.map((p, i) => (
            <ProjectCard key={p.id} p={p} index={i + 2} />
          ))}
        </div>

        {/* scan-first index of every case */}
        <div data-case-index className="mt-24 md:mt-32">
          <div className="flex items-end justify-between border-b border-[color:var(--hairline)] pb-4">
            <p className="mono-label text-[color:var(--violet-2)]">ALL CASES</p>
            <p className="mono-label text-[color:var(--muted)]">
              {String(PRODUCTS.length).padStart(2, "0")} / INDEX
            </p>
          </div>
          <ul
            onPointerMove={canPreview ? movePreview : undefined}
            onPointerLeave={canPreview ? () => setPreview(null) : undefined}
          >
            {PRODUCTS.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  data-case-link
                  data-case-label={p.name}
                  data-case-row
                  onPointerEnter={canPreview ? () => setPreview(p) : undefined}
                  className="group grid grid-cols-[2.25rem_1fr_auto_1.5rem] items-baseline gap-x-4 border-b border-[color:var(--hairline)] py-5 transition-colors md:grid-cols-[4rem_1.6fr_1fr_4.5rem_6rem_2rem] md:items-center md:px-2"
                >
                  <span className="font-mono text-xs text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--violet-2)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="display block text-2xl leading-tight text-[color:var(--paper)] transition-colors group-hover:text-[color:var(--violet-2)] md:text-4xl">
                      {p.name}
                    </span>
                    <span className="mono-label mt-1 block text-[color:var(--muted)] md:hidden">
                      {p.category}
                    </span>
                  </span>
                  <span className="mono-label hidden text-[color:var(--muted)] md:block">{p.category}</span>
                  <span className="mono-label hidden text-[color:var(--muted)] md:block">{p.year}</span>
                  <span
                    className={`mono-label flex items-center gap-2 ${
                      p.status === "LIVE" ? "text-[color:var(--ok)]" : "text-[color:var(--violet-2)]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        p.status === "LIVE" ? "bg-[color:var(--ok)]" : "bg-[color:var(--violet-2)]"
                      }`}
                    />
                    {p.status}
                  </span>
                  <span className="mono-label text-right text-[color:var(--paper)] transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1">
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {canPreview ? (
          <div
            ref={previewRef}
            data-case-preview
            aria-hidden="true"
            className={`pointer-events-none fixed left-0 top-0 z-[60] h-[200px] w-[280px] overflow-hidden rounded-xl border border-[color:var(--hairline)] bg-[color:var(--ink-2)] shadow-[0_24px_80px_rgba(0,0,0,0.6)] transition-opacity duration-200 ${
              preview ? "opacity-100" : "opacity-0"
            }`}
          >
            {preview ? (
              <Image src={preview.cover} alt="" fill sizes="280px" className="object-cover" />
            ) : null}
          </div>
        ) : null}

        <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-[color:var(--hairline)] pt-8 md:flex-row md:items-center">
          <p className="mono-label text-[color:var(--muted)]">MORE IN ORBIT · NEXT UP, SOON</p>
          <a
            href="#contact"
            className="mono-label group inline-flex items-center gap-2 rounded-full border border-[color:var(--hairline)] px-5 py-3 text-[color:var(--paper)] transition-colors duration-200 hover:border-[color:var(--violet-2)]"
          >
            START A PROJECT
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            >
              ↗
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
