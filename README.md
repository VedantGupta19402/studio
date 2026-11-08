# Opera® — studio site

Dark-first product-studio site: Emotion-agency motion grammar (particle world,
scene-locked morphs, glitch statement swaps, implosion flashes) in Hamol-depth
space-dark, built for Opera's own copy and products.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · three.js (raw,
own shaders) · GSAP ScrollTrigger · Lenis · next/font (Fraunces, Space Grotesk,
JetBrains Mono)

## Run
```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Architecture
- `lib/heroScene.ts` — the particle world: 6 generated morph targets (swirl, egg,
  cube, sphere, tree, ring) as buffer attributes, per-particle phase stagger,
  cursor repulsion, implosion bursts, ridge parallax, waterline reflection, sky
  gradient + horizon glow. DPR cap 1.75, particle count by device tier.
- `components/sections/HeroWorld.tsx` — 620vh pinned journey; scene windows lock
  each statement to its particle shape; wireframe glitch swap; mobile chrome rules.
- `content/opera.ts` — every string on the site, typed. Placeholders are
  `⟨PLACEHOLDER: …⟩`-shaped (grep-able gate).
- `lib/sound.ts` — Web Audio engine (no audio files): violet drone bed + a sub
  thump fired on the same frame as the visual heartbeat; scoped to the hero
  journey only, default-on with first-gesture unlock, persisted mute via the
  nav toggle.

## Quality gates (checked 2026-11-04)
- 0 console errors (desktop + mobile + reduced-motion pass)
- reduced-motion: static readable frame, no RAF
- 390px mobile: stacked CTAs, reduced chrome, portrait-centered mark
- audit: no high-severity anti-patterns (grain + scroll pulse are info-level)

## Owner TODO (placeholders)
- domain + `hello@…` email (content/opera.ts `SITE.url`, `SITE.email`)
- Prachetan & Vedant LinkedIn URLs
- portraits (monogram tiles render until supplied)
