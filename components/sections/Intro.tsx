"use client";
// The About page, revealed inside the finale: the section is pulled up over the
// hero's last viewport so it appears as the ring opens onto space ink, then the
// statement lights word by word as the page settles (reference grammar).
import { useEffect, useRef } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { INTRO } from "@/content/opera";

const DIM = "rgba(245,239,255,0.28)";
const LIT = "#F5EFFF";

export default function Intro() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    const el = ref.current!;
    const pill = el.querySelector<HTMLElement>("[data-reveal='pill']");
    const services = el.querySelector<HTMLElement>("[data-reveal='services']");
    const words = el.querySelectorAll("[data-word]");
    // while the hero is still pinned the section sits over the canvas but is
    // invisible — keep it out of the pointer and tab order until it reveals
    el.inert = true;
    const ctx = gsap.context(() => {
      gsap.set([pill, services], { y: 34, opacity: 0 });
      gsap.set(words, { y: 22, opacity: 0, color: DIM });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          // the page starts lighting as the ring leaves the frame and finishes
          // while the statement is still on screen: 51vh of scroll
          start: "top 45%",
          end: "top -6%",
          scrub: true,
          onUpdate: (self) => {
            el.inert = self.progress <= 0.001;
          },
          onLeaveBack: () => {
            el.inert = true;
          },
        },
      });
      tl.to(pill, { y: 0, opacity: 1, duration: 0.18, ease: "power2.out" }, 0)
        .to(services, { y: 0, opacity: 1, duration: 0.22, ease: "power2.out" }, 0.08)
        .to(words, { y: 0, opacity: 1, duration: 0.22, ease: "power2.out", stagger: 0.01 }, 0.04)
        .to(words, { color: LIT, duration: 0.4, ease: "none", stagger: 0.012 }, 0.1);
    }, el);
    return () => {
      el.inert = false;
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={ref}
      id="about-intro"
      className="relative z-30 -mt-[100vh] min-h-screen px-6 py-32 md:px-12 md:py-44 [@media(prefers-reduced-motion:reduce)]:mt-0 [@media(prefers-reduced-motion:reduce)]:bg-[color:var(--ink)]"
    >
      <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p data-reveal="pill" className="mono-label mb-8 inline-block rounded-full border border-[color:var(--hairline)] px-4 py-2 text-[color:var(--violet-2)]">
            {INTRO.kicker}
          </p>
          <p className="display text-[clamp(1.7rem,3.4vw,3.1rem)] leading-[1.15] text-[color:var(--paper)]">
            {INTRO.statement.split(" ").map((w, i) => (
              <span key={i} data-word className="inline-block whitespace-pre">
                {w + " "}
              </span>
            ))}
          </p>
        </div>
        <div data-reveal="services">
          <p className="mono-label mb-6 text-[color:var(--muted)]">{INTRO.servicesLabel}</p>
          <ul className="space-y-0">
            {INTRO.services.map((s) => (
              <li key={s} className="hairline-t py-3 font-mono text-sm tracking-wide text-[color:var(--muted)] transition-colors hover:text-[color:var(--paper)]">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
