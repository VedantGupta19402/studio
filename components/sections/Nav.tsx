"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_LINKS, SITE } from "@/content/opera";
import { setScrollLocked } from "@/lib/lenis";
import { useOperaSound } from "@/lib/sound";
import DecodeLink from "@/components/ui/DecodeLink";

function SoundToggle() {
  const { enabled, audible, toggle } = useOperaSound();
  return (
    <button
      type="button"
      data-sound-toggle
      data-playing={audible}
      aria-pressed={enabled}
      aria-label={enabled ? "Turn sound off" : "Turn sound on"}
      onClick={toggle}
      className={`flex h-10 min-w-10 shrink-0 items-center justify-center gap-2.5 rounded-full border px-2.5 outline-none transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-[color:var(--violet-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ink)] sm:px-4 ${
        audible
          ? "border-[color:var(--violet-2)]/60 text-[color:var(--violet-2)]"
          : "border-[color:var(--hairline)] text-[color:var(--muted)] hover:border-[color:var(--violet-2)] hover:text-[color:var(--paper)]"
      }`}
    >
      <span className="sound-bars" data-playing={audible} aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <span className="mono-label hidden sm:grid">
        <span
          aria-hidden={!enabled}
          className={`[grid-area:1/1] transition-opacity duration-200 ${enabled ? "opacity-100" : "opacity-0"}`}
        >
          Sound on
        </span>
        <span
          aria-hidden={enabled}
          className={`[grid-area:1/1] transition-opacity duration-200 ${enabled ? "opacity-0" : "opacity-100"}`}
        >
          Sound off
        </span>
      </span>
    </button>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const onHome = pathname === "/";
  const homeHref = (hash: string) => (onHome ? hash : `/${hash}`);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // a route change always starts with the sheet closed
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    setScrollLocked(true);
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    sheetRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    return () => {
      setScrollLocked(false);
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [menuOpen]);

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
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="mono-label hidden text-[color:var(--muted)] lg:inline">{time ?? "--:-- IST"}</span>
          <span className="mono-label hidden items-center gap-2 text-[color:var(--paper)] sm:flex">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--ok)]" />
            {SITE.availability}
          </span>
          <SoundToggle />
          <a
            href={homeHref("#contact")}
            className="mono-label rounded-full border border-[color:var(--hairline)] px-4 py-2 text-[color:var(--paper)] transition-colors hover:border-[color:var(--violet-2)]"
          >
            Let&apos;s talk ↗
          </a>
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="relative -mr-2 z-[71] flex h-11 w-11 items-center justify-center rounded-full outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--violet-2)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--ink)] md:hidden"
          >
            <span
              className={`absolute h-px w-5 bg-[color:var(--paper)] transition-transform duration-300 ease-out ${
                menuOpen ? "rotate-45" : "-translate-y-[4px]"
              }`}
            />
            <span
              className={`absolute h-px w-5 bg-[color:var(--paper)] transition-transform duration-300 ease-out ${
                menuOpen ? "-rotate-45" : "translate-y-[4px]"
              }`}
            />
          </button>
        </div>
      </nav>

      {/* full-screen sheet below md */}
      <div
        id="mobile-menu"
        ref={sheetRef}
        inert={!menuOpen}
        className={`fixed inset-0 z-[70] flex flex-col bg-[color:var(--ink)] px-6 pb-8 pt-5 transition-[opacity,transform] duration-[400ms] ease-out md:hidden ${
          menuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        <div className="flex h-11 items-center">
          <span className="display text-lg text-[color:var(--paper)]">{SITE.wordmark}</span>
        </div>

        <nav aria-label="Sections" className="mt-14 flex-1">
          <ul>
            {NAV_LINKS.map((l, i) => (
              <li key={l.href} className="hairline-t last:border-b last:border-[color:var(--hairline)]">
                <a
                  href={homeHref(l.href)}
                  onClick={closeMenu}
                  className="group flex items-baseline gap-5 py-5"
                >
                  <span className="font-mono text-xs text-[color:var(--muted)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="display text-[clamp(2.4rem,10vw,3.4rem)] leading-none text-[color:var(--paper)]">
                    {l.label}
                  </span>
                  <span className="ml-auto text-[color:var(--muted)] transition-transform duration-200 group-hover:translate-x-1">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-5 pt-8">
          <div className="flex items-center justify-between gap-4">
            <div className="mono-label flex items-center gap-2 text-[color:var(--paper)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--ok)]" />
              {SITE.availability}
            </div>
            <SoundToggle />
          </div>
          <p className="mono-label text-[color:var(--muted)]">{time ?? "--:-- IST"} — {SITE.est}</p>
          <a
            href={homeHref("#contact")}
            onClick={closeMenu}
            className="mono-label flex items-center justify-between rounded-full border border-[color:var(--hairline)] px-5 py-4 text-[color:var(--paper)] transition-colors hover:border-[color:var(--violet-2)]"
          >
            Let&apos;s talk <span>↗</span>
          </a>
        </div>
      </div>
    </header>
  );
}
