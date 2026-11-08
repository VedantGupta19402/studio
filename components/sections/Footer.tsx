"use client";
// Footer/contact — Emotion's giant-type closing + link columns, our copy.
import { usePathname } from "next/navigation";
import { CONTACT, SITE } from "@/content/opera";

export default function Footer() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const resolve = (href: string) => (href.startsWith("#") && !onHome ? `/${href}` : href);
  return (
    <footer id="contact" className="hairline-t bg-[color:var(--ink)] px-6 pb-10 pt-32 md:px-12 md:pt-44">
      <div className="mx-auto max-w-7xl">
        <p className="mono-label mb-10 text-[color:var(--violet-2)]">{CONTACT.kicker}</p>

        <div className="grid gap-16 md:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="display text-[clamp(3rem,9vw,8rem)] leading-[0.95] text-[color:var(--paper)]">
              {CONTACT.line1}
              <span className="block italic text-[color:var(--violet-2)]">{CONTACT.line2}</span>
            </h2>
            <a
              href={`mailto:${CONTACT.email}`}
              className="mono-label mt-12 inline-flex items-center gap-3 rounded-full bg-[color:var(--paper)] px-7 py-4 text-[color:var(--ink)] transition-transform hover:-translate-y-0.5"
            >
              {CONTACT.email} ↗
            </a>
            <p className="mono-label mt-6 flex items-center gap-2 text-[color:var(--muted)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--ok)]" />
              {SITE.availability} · {CONTACT.promise}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 self-end">
            {CONTACT.columns.map((col) => (
              <div key={col.title}>
                <p className="mono-label mb-5 text-[color:var(--muted)]">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label + l.href}>
                      <a
                        href={resolve(l.href)}
                        target={l.href?.startsWith("http") ? "_blank" : undefined}
                        rel="noopener"
                        className="text-sm text-[color:var(--muted)] transition-colors hover:text-[color:var(--paper)]"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="hairline-t mt-24 flex flex-wrap items-center justify-between gap-4 pt-6">
          <p className="mono-label text-[color:var(--muted)]">
            {SITE.wordmark} · {SITE.kicker}
          </p>
          <p className="mono-label text-[color:var(--muted)]">© 2026 {SITE.name}</p>
          <a
            href={onHome ? "#hero" : "/"}
            className="mono-label text-[color:var(--muted)] transition-colors hover:text-[color:var(--paper)]"
          >
            BACK TO TOP ↑
          </a>
        </div>

        <p className="mono-label mt-10 text-center text-[color:var(--muted)] opacity-70">
          {SITE.microStrip}
        </p>
      </div>
    </footer>
  );
}
