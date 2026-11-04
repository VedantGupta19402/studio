"use client";
// HeroWorld — the pinned particle journey: sticky canvas + 600vh virtual scroll,
// five statement scenes with the wireframe-glitch swap (Emotion motion grammar, Opera copy).
import { useEffect, useRef, useState } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { initLenis } from "@/lib/lenis";
import { createHeroScene, type HeroSceneHandle } from "@/lib/heroScene";
import { HERO_SCENES, HERO_CTA, SITE } from "@/content/opera";

// progress windows per scene (equal fifths, overlap-free swaps)
const SCENE_COUNT = HERO_SCENES.length;

export default function HeroWorld() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HeroSceneHandle | null>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [bursting, setBursting] = useState(false);
  useEffect(() => {
    // flash overlay tracks scene changes (covers the morph crossing)
    if (activeRef.current === 0) return;
    setBursting(true);
    const t = setTimeout(() => setBursting(false), 480);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => {
    // deterministic start: never restore a mid-journey scroll position
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const reduced = prefersReducedMotion();
    const { gsap, ScrollTrigger } = registerGsap();
    const stopLenis = initLenis();

    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    let scene: HeroSceneHandle | null = null;
    let disposed = false;

    const boot = () => {
      if (disposed) return;
      const tier = (navigator.hardwareConcurrency || 4) >= 8 ? 16000 : 9000;
      const isMobile = window.innerWidth < 768;
      scene = createHeroScene(canvas, { reducedMotion: reduced });
      sceneRef.current = scene;

      const onResize = () =>
        scene?.resize(canvas.clientWidth, canvas.clientHeight);
      onResize();
      window.addEventListener("resize", onResize);

      const onPointer = (e: PointerEvent) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = -((e.clientY / window.innerHeight) * 2 - 1);
        scene?.setPointer(nx * 1.4, ny * 0.9);
      };
      if (!reduced) window.addEventListener("pointermove", onPointer);

      if (!reduced) {
        ScrollTrigger.create({
          trigger: wrap,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            // reference breakpoints: scenes are unequal spans [0.18, 0.4, 0.65, 0.87]
            const BREAKS = [0.18, 0.4, 0.65, 0.87];
            let idx = 0;
            for (let i = BREAKS.length - 1; i >= 0; i--) {
              if (self.progress > BREAKS[i]) { idx = i + 1; break; }
            }
            // spring-based morph: shape swap + burst; physics does the travel
            scene?.setScene(idx);
            scene?.setProgress(self.progress);
            if (idx !== activeRef.current) {
              activeRef.current = idx;
              setActive(idx);
            }
          },
        });
      }
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointer);
      };
    };

    const cleanupBoot = boot();

    return () => {
      disposed = true;
      cleanupBoot?.();
      scene?.dispose();
      sceneRef.current = null;
      stopLenis();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const scene = HERO_SCENES[active];

  return (
    <div ref={wrapRef} id="hero" className="relative h-[620vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {/* white-violet implosion flash on scene change */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 ${
            bursting ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "radial-gradient(circle at 62% 42%, rgba(245,239,255,0.95) 0%, rgba(181,123,255,0.55) 28%, rgba(15,13,26,0) 62%)",
          }}
        />

        {/* chrome — kicker (scene 1 only) */}
        <div className={}>
          <p className="mono-label flex items-center gap-2 text-[color:var(--violet-2)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--ok)]" />
            {SITE.kicker}
          </p>
        </div>

        {/* statement stack */}
        <div className="absolute bottom-[9vh] left-6 z-10 max-w-[86vw] md:left-12 md:max-w-[62vw]">
          {HERO_SCENES.map((s, i) => {
            const isActive = i === active;
            return (
              <div
                key={s.id}
                aria-hidden={!isActive}
                className={`transition-all duration-500 ${
                  isActive
                    ? "opacity-100 translate-y-0"
                    : "pointer-events-none absolute inset-x-0 bottom-0 opacity-0 translate-y-6"
                }`}
              >
                {s.mono ? (
                  <p className="mono-label mb-4 text-[color:var(--violet-2)]">{s.mono}</p>
                ) : null}
                {s.lead ? (
                  <p className="display text-[clamp(1.4rem,3vw,2.6rem)] italic text-[color:var(--paper)]">
                    {s.lead}
                  </p>
                ) : null}
                <h1
                  className={`display mt-2 whitespace-pre-line text-[clamp(2.6rem,7.2vw,6.4rem)] uppercase text-[color:var(--paper)] ${
                    isActive ? "statement-live" : ""
                  }`}
                >
                  {/* solid + wireframe layers for the glitch swap */}
                  <span className="relative inline-block">
                    <span className="statement-solid">{s.caps}</span>
                    <span
                      aria-hidden="true"
                      className="statement-wire pointer-events-none absolute inset-0"
                    >
                      {s.caps}
                    </span>
                  </span>
                </h1>
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="absolute bottom-[4vh] left-6 right-6 z-10 flex flex-col gap-3 sm:left-12 sm:right-auto sm:flex-row md:left-12">
          {HERO_CTA.map((c) => (
            <a
              key={c.href + c.label}
              href={c.href}
              className={`mono-label rounded-full px-5 py-2.5 transition-colors duration-200 ${
                c.label.startsWith("See")
                  ? "bg-[color:var(--paper)] text-[color:var(--ink)] hover:bg-white"
                  : "border border-[color:var(--hairline)] text-[color:var(--paper)] hover:border-[color:var(--violet-2)]"
              }`}
            >
              {c.label}
            </a>
          ))}
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-0 left-1/2 z-10 hidden -translate-x-1/2 sm:block">
          <div className="flex flex-col items-center gap-2 pb-4">
            <span className="mono-label text-[color:var(--muted)]">Scroll</span>
            <span className="block h-10 w-px animate-pulse bg-[color:var(--hairline)]" />
          </div>
        </div>

        {/* est strip */}
        <div className="absolute bottom-6 right-6 z-10 hidden md:right-12 sm:block">
          <p className="mono-label text-[color:var(--muted)]">{SITE.est}</p>
        </div>

        {/* subline under first statement */}
        <p className={`mono-label absolute bottom-[26vh] left-6 z-10 hidden max-w-sm leading-relaxed transition-opacity duration-500 md:left-12 md:block ${active === 0 ? "opacity-100" : "opacity-0"}`} aria-hidden={active !== 0}>
          {SITE.name} builds client products end-to-end — and ships its own. Live,
          linkable, running.
        </p>
      </div>
    </div>
  );
}
