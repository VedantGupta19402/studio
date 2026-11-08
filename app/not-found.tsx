import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS, NOT_FOUND, SITE } from "@/content/opera";

export const metadata: Metadata = {
  title: `404 — ${SITE.name}®`,
};

export default function NotFound() {
  return (
    <main id="main" className="relative flex min-h-screen flex-col overflow-hidden bg-[color:var(--ink)] px-6 py-6 md:px-12">
      {/* a watermark of the number itself — quiet, behind everything */}
      <span
        aria-hidden="true"
        className="display pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 select-none text-[34vw] leading-none text-[color:var(--paper)]/[0.035] md:-right-10 md:block"
      >
        404
      </span>

      <header className="relative flex items-center justify-between">
        <Link href="/" className="display text-lg text-[color:var(--paper)]">
          {SITE.wordmark}
        </Link>
        <Link
          href="/#contact"
          className="mono-label rounded-full border border-[color:var(--hairline)] px-4 py-2 text-[color:var(--paper)] transition-colors hover:border-[color:var(--violet-2)]"
        >
          Let&apos;s talk ↗
        </Link>
      </header>

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center py-16">
        <p className="mono-label text-[color:var(--violet-2)]">{NOT_FOUND.kicker}</p>
        <h1 className="display mt-6 max-w-3xl text-[clamp(2.8rem,8vw,7rem)] leading-[0.95] text-[color:var(--paper)]">
          {NOT_FOUND.titleLead}{" "}
          <span className="italic text-[color:var(--violet-2)]">{NOT_FOUND.titleCaps}</span>
        </h1>
        <p className="mono-label mt-8 max-w-md leading-loose text-[color:var(--muted)]">{NOT_FOUND.line}</p>

        <div className="mt-16 max-w-2xl">
          <p className="mono-label mb-3 text-[color:var(--muted)]">{NOT_FOUND.casesLabel}</p>
          <ul>
            {PRODUCTS.map((p, i) => (
              <li key={p.id} className="hairline-t last:border-b last:border-[color:var(--hairline)]">
                <Link
                  href={`/projects/${p.id}`}
                  className="group grid grid-cols-[2.25rem_1fr_auto] items-center gap-4 py-4"
                >
                  <span className="font-mono text-xs text-[color:var(--muted)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="display text-xl text-[color:var(--paper)] transition-colors duration-200 group-hover:text-[color:var(--violet-2)] md:text-2xl">
                    {p.name}
                  </span>
                  <span className="text-[color:var(--muted)] transition-transform duration-200 group-hover:translate-x-1">
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/"
          className="mono-label mt-14 inline-flex w-fit items-center gap-2 border-b border-[color:var(--violet-2)] pb-1 text-[color:var(--paper)]"
        >
          {NOT_FOUND.homeLabel} ↓
        </Link>
      </div>
    </main>
  );
}
