"use client";
// Ink curtain for case navigation: covers the grid, lifts once the route lands.
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Phase = "idle" | "cover" | "reveal";

export default function CaseCurtain() {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState("");
  const pending = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.detail === 0 ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[data-case-link]");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("/projects/")) return;

      event.preventDefault();
      clearTimers();
      pending.current = href;
      setLabel(link.getAttribute("data-case-label") ?? "");
      setPhase("cover");
      timers.current.push(
        window.setTimeout(() => {
          router.push(href);
        }, 620),
      );
      // if the route never lands, put the page back
      timers.current.push(
        window.setTimeout(() => {
          if (pending.current) {
            pending.current = null;
            setPhase("idle");
          }
        }, 8000),
      );
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, [router]);

  useEffect(() => {
    if (!pending.current) return;
    pending.current = null;
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setPhase("reveal");
    timers.current.push(window.setTimeout(() => setPhase("idle"), 680));
  }, [pathname]);

  return (
    <div className="case-curtain" data-phase={phase} aria-hidden="true">
      <div className="case-curtain__inner">
        <span className="mono-label text-[color:var(--violet-2)]">OPENING CASE</span>
        <span className="display text-3xl text-[color:var(--paper)] md:text-5xl">{label}</span>
        <span className="case-curtain__rule" />
      </div>
    </div>
  );
}
