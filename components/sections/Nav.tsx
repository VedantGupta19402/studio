"use client";
import { useEffect, useState } from "react";
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
  return (
    <header
      data-site-nav
      className="fixed inset-x-0 top-0 z-50"
    >
      <nav className="flex items-center justify-between px-6 py-5 md:px-12" aria-label="Main">
        <DecodeLink
          href="#hero"
          text={SITE.wordmark}
          className="display text-lg text-[color:var(--paper)]"
        />
        <div className="mono-label hidden gap-8 text-[color:var(--muted)] md:flex">
          {NAV_LINKS.map((l) => (
            <DecodeLink
              key={l.href}
              href={l.href}
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
            href="#contact"
            className="mono-label rounded-full border border-[color:var(--hairline)] px-4 py-2 text-[color:var(--paper)] transition-colors hover:border-[color:var(--violet-2)]"
          >
            Let&apos;s talk ↗
          </a>
        </div>
      </nav>
    </header>
  );
}
