"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_LINKS, SITE } from "@/content/opera";
import DecodeLink from "@/components/ui/DecodeLink";

function useIstClock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
      setTime(
        `${String(ist.getHours()).padStart(2, "0")}:${String(ist.getMinutes()).padStart(2, "0")} IST`,
      );
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Nav() {
  const time = useIstClock();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const onHome = pathname === "/";
  const homeHref = (hash: string) => (onHome ? hash : `/${hash}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-site-nav
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? "border-[color:var(--hairline)] bg-[color:var(--ink)]/80 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav className="flex items-center justify-between px-6 py-5 md:px-12" aria-label="Main">
        <DecodeLink
          href={onHome ? "#hero" : "/"}
          text={SITE.wordmark}
          className="display text-lg text-[color:var(--paper)]"
        />
        <div className="mono-label hidden gap-8 text-[color:var(--muted)] md:flex">
          {NAV_LINKS.map((l) => (
            <DecodeLink
              key={l.href}
              href={homeHref(l.href)}
              text={l.label}
              className="transition-colors hover:text-[color:var(--paper)]"
            />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="mono-label hidden text-[color:var(--muted)] lg:inline">{time ?? "--:-- IST"}</span>
          <span className="mono-label hidden items-center gap-2 text-[color:var(--paper)] sm:flex">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--ok)]" />
            {SITE.availability}
          </span>
          <a
            href={homeHref("#contact")}
            className="mono-label rounded-full border border-[color:var(--hairline)] px-4 py-2 text-[color:var(--paper)] transition-colors hover:border-[color:var(--violet-2)]"
          >
            Let&apos;s talk ↗
          </a>
        </div>
      </nav>
    </header>
  );
}
