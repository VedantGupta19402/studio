// content/opera.ts — single typed source for ALL site copy (spec: Task 1)
// Placeholders are ⟨PLACEHOLDER: …⟩-shaped so the content gate can find them.

export const SITE = {
  name: "Opera",
  wordmark: "Opera®",
  tagline: "We don't pitch. We ship.",
  description:
    "Opera — a three-human product studio in India. We build client products end-to-end, and ship our own. Live, linkable, running.",
  url: "⟨PLACEHOLDER: site url⟩",
  email: "hello@⟨PLACEHOLDER: domain⟩",
  est: "EST. 2026 — INDIA",
  kicker: "PRODUCT STUDIO — INDIA",
  availability: "OPEN FOR PROJECTS",
  microStrip: "DESIGNED IN THE DARK · SHIPPED IN THE OPEN",
} as const;

export const NAV_LINKS = [
  { label: "Work", href: "#work" },
  { label: "Products", href: "#products" },
  { label: "Studio", href: "#studio" },
  { label: "Team", href: "#team" },
] as const;

// ---- Hero world: five statement scenes (locked copy from design-direction.md) ----
export type HeroScene = {
  id: string;
  /** mono kicker shown above/below the statement (some scenes) */
  mono?: string;
  /** italic lead line */
  lead?: string;
  /** caps display line(s) */
  caps: string;
  /** particle shape shown during this scene */
  shape: "glyph" | "cube" | "sphere" | "heart" | "torus";
};

export const HERO_SCENES: HeroScene[] = [
  { id: "s1", lead: "We don't pitch.", caps: "WE SHIP.", shape: "glyph" },
  { id: "s2", lead: "We", caps: "BUILD CLIENT PRODUCTS —\nAND SHIP OUR OWN.", shape: "cube" },
  { id: "s3", mono: "PROOF", caps: "LIVE, LINKABLE,\nRUNNING.", shape: "cube" },
  { id: "s4", lead: "Small team.", caps: "SERIOUS CRAFT.", shape: "heart" },
  { id: "s5", lead: "Every product", caps: "DESERVES A PREMIERE.", shape: "torus" },
] as const;

export const HERO_CTA = [
  { label: "See the work ↓", href: "#work" },
  { label: "Let's talk ↗", href: "#contact" },
] as const;

// ---- Intro document section ----
export const INTRO = {
  kicker: "WHO WE ARE",
  /** word-highlight statement — words colorize on scroll */
  statement:
    "Opera builds client products end-to-end — and ships its own. We start with why, then design, engineer and run the rest. Live, linkable, running.",
  servicesLabel: "WHAT WE TAKE ON",
  services: [
    "Web Products",
    "AI-Native Tooling",
    "WebGL Experiences",
    "Audits & Rebuilds",
    "MVP Rescues",
    "Design Systems",
  ],
} as const;

// ---- Projects & builds (real data, spec §2) ----
export type ProjectChapter = { title: string; body: string };

export type Product = {
  id: string; // route slug
  name: string;
  blurb: string; // card line
  category: string;
  status: "LIVE" | "DEMO";
  statusNote: string; // human status shown on the cover
  year: string;
  role: string;
  lede: string; // case-page intro
  brief: { statement: string; body: string };
  chapters: ProjectChapter[];
  media?: { src: string; alt: string; caption: string };
  outcome: { statement: string; body: string };
  facts: { label: string; value: string }[];
  stack: string[];
  url?: string; // live product
  repo?: string; // public source
  npm?: string;
  note?: string;
  hue: string; // card glow hue
  cover: string;
  feature?: { src: string; alt: string };
  coverAlt: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "traceon",
    name: "Traceon",
    blurb: "Codebase intelligence. Map dependencies, impact and engineering DNA.",
    category: "Developer Tools / AI",
    status: "LIVE",
    statusNote: "Live · MIT · npm",
    year: "2026",
    role: "Product, design and engineering",
    lede: "Traceon reads a repository and turns it into a graph you can move through. Pick a file, see what breaks, and understand the code before you touch it.",
    brief: {
      statement: "Understanding a codebase should not take a week.",
      body: "Every new repository costs days of reading before a safe change. Traceon clones a project, parses every source file with the TypeScript Compiler API, and builds a dependency graph in the browser. A CLI version does the same work on a local folder, with no account and no upload.",
    },
    chapters: [
      {
        title: "Parse once, see everything",
        body: "Worker threads walk the repository and build an AST for each source file. The result is one graph of imports, cycles and shared modules.",
      },
      {
        title: "Rank the blast radius",
        body: "Every node gets an impact score from 0 to 100. Select a file to see its radius, its circular chains and the files that depend on it.",
      },
      {
        title: "Read the graph over time",
        body: "Snapshots compare architecture across commits with red and green diffs. Graphs export as PNG, SVG, PDF or a standalone HTML viewer.",
      },
      {
        title: "Profile the engineer",
        body: "The Profile DNA checker reads public GitHub activity and scores six axes with Groq and Llama 3.3. The rubric is strict on purpose.",
      },
    ],
    media: {
      src: "/work/traceon-detail.webp",
      alt: "Traceon analysis screen with a particle dependency graph and a detected cycle panel",
      caption: "Cycle detection inside Traceon's dependency graph.",
    },
    outcome: {
      statement: "A web app and a CLI, one analysis core.",
      body: "Traceon ships as a hosted Next.js app and as traceon-analyzer on npm. The CLI needs Node 18 or newer and never sends code off the machine. The web app adds saved history, snapshot diffs and AI chat.",
    },
    facts: [
      { label: "License", value: "MIT" },
      { label: "Package", value: "traceon-analyzer" },
      { label: "Surfaces", value: "Web + CLI" },
      { label: "Model", value: "Llama 3.3 70B" },
    ],
    stack: ["Next.js 16", "TypeScript", "React Flow", "MongoDB", "Groq", "Tailwind v4"],
    url: "https://traceon.vercel.app",
    repo: "https://github.com/rishabhx29/Traceon",
    npm: "https://www.npmjs.com/package/traceon-analyzer",
    hue: "#9047FF",
    cover: "/work/traceon-cover.webp",
    feature: {
      src: "/work/traceon-feature.webp",
      alt: "A stream of particles linked by orbital rings from the Traceon landing page",
    },
    coverAlt: "Traceon landing page with a particle galaxy and the line Every codebase is a timeline",
  },
  {
    id: "velokey",
    name: "VeloKey",
    blurb: "A typing test that stays out of the way. Solo drills and live races.",
    category: "Open-source Web App",
    status: "LIVE",
    statusNote: "Live · Apache-2.0",
    year: "2026",
    role: "Product, design and engineering",
    lede: "A quiet typing test for daily practice, with a race mode for when the room needs noise.",
    brief: {
      statement: "A typing test should measure typing, not distract from it.",
      body: "Most typing sites compete with their own interface. VeloKey strips the page back to the text. Solo mode covers timed drills, word counts, quotes and code. Race mode adds up to eight players over WebSockets, with live carets and a server that checks the result.",
    },
    chapters: [
      {
        title: "Solo practice, six ways",
        body: "Time, words, quotes, code, Zen and difficulty tiers across 38 languages, including right-to-left scripts.",
      },
      {
        title: "Races that hold up",
        body: "PartyKit rooms support shareable codes, QR invites, host migration and a 10 second rejoin window. The server validates stats before a result counts.",
      },
      {
        title: "Make it yours",
        body: "17 themes, five keyboard skins, mechanical sound packs and haptics. Every setting is local and no account is required.",
      },
      {
        title: "Test the edges",
        body: "259 unit tests and a Playwright suite cover the race protocol, validation and the typing engine.",
      },
    ],
    media: {
      src: "/work/velokey-detail.webp",
      alt: "VeloKey solo test view with a paragraph of text and a virtual keyboard",
      caption: "The solo test view. Text first, everything else quiet.",
    },
    outcome: {
      statement: "Open source, and open to race.",
      body: "VeloKey runs at velokey.app under Apache-2.0. The race server scales per room, and one protocol is shared between the web app and the realtime service.",
    },
    facts: [
      { label: "License", value: "Apache-2.0" },
      { label: "Tests", value: "259" },
      { label: "Languages", value: "38" },
      { label: "Players", value: "8 per race" },
    ],
    stack: ["Next.js", "TypeScript", "PartyKit", "WebSockets", "Vitest", "Playwright"],
    url: "https://velokey.app",
    repo: "https://github.com/rishabhx29/velokey",
    hue: "#B57BFF",
    cover: "/work/velokey-cover.webp",
    coverAlt: "VeloKey cover with the line A Faster You above a laptop running a typing test",
  },
  {
    id: "thriftdex",
    name: "ThriftDex",
    blurb: "A digital archive for vintage clothing. One-off pieces, sourced and restored.",
    category: "E-commerce / Fashion",
    status: "LIVE",
    statusNote: "Live · India",
    year: "2026",
    role: "Design and engineering",
    lede: "A storefront for one-of-one vintage and archive clothing, built around the pieces instead of the discounts.",
    brief: {
      statement: "Second-hand clothing deserved a better shop window.",
      body: "ThriftDex treats vintage as an archive. Each drop is sourced, inspected and listed as a single piece, from 90s sportswear to Y2K outerwear. The design borrows from editorial catalogues: large type, full-bleed photography and a quiet product grid.",
    },
    chapters: [
      {
        title: "One piece, one listing",
        body: "There is no size run. Every item is unique, so the product page carries the full story of that garment.",
      },
      {
        title: "Archive, not bargain bin",
        body: "The archive, rare archive and denim archive sections organise stock by era and category, with editorial pages between them.",
      },
      {
        title: "Built for India",
        body: "Prices are in INR and shipping is free above ₹5,000. The storefront keeps the catalogue easy to scan on a phone.",
      },
    ],
    media: {
      src: "/work/thriftdex-detail.webp",
      alt: "ThriftDex rare archive grid with product cards labelled Grail Status",
      caption: "The Rare Archive. Each garment gets its own listing.",
    },
    outcome: {
      statement: "A catalogue that reads like a magazine.",
      body: "ThriftDex lists one-off pieces in INR for buyers in India. The archive structure keeps unique stock easy to browse and gives every garment a page of its own.",
    },
    facts: [
      { label: "Market", value: "India" },
      { label: "Currency", value: "INR" },
      { label: "Inventory", value: "1-of-1" },
      { label: "Shipping", value: "Free over ₹5,000" },
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "Framer Motion"],
    url: "https://thrift-dex.vercel.app",
    hue: "#7FE08A",
    cover: "/work/thriftdex-cover.webp",
    coverAlt: "ThriftDex archive page with large THE ARCHIVE type and three editorial clothing photographs",
  },
  {
    id: "orion-ink",
    name: "ORION/INK",
    blurb: "A cinematic tattoo atelier. Custom ink shader, film and scroll.",
    category: "WebGL Experience",
    status: "DEMO",
    statusNote: "Live demo",
    year: "2026",
    role: "Design and engineering · Vedant Gupta",
    lede: "ORION BLACK is a tattoo studio site built like a film. A video hero dissolves into a live ink shader as you scroll.",
    brief: {
      statement: "A tattoo studio site should feel like the studio, not a template.",
      body: "The brief was an awards-level single scroll for ORION BLACK. The site moves through four chapters: hero, work, booking and archive. Each section is code-split, and nothing below the hero costs a byte until you approach it.",
    },
    chapters: [
      {
        title: "Ink, written in GLSL",
        body: "A hand-written six-octave FBM shader drives the hero. Mouse distance feeds a damped sine wave, and scroll controls the dissolve from video to ink.",
      },
      {
        title: "Scroll with weight",
        body: "Lenis and GSAP ScrollTrigger share one ticker, so every pinned section and word reveal reads the same scroll position.",
      },
      {
        title: "Book without a backend",
        body: "A two-step booking modal collects date, style and idea, then confirms with a summary. State stays local to prove the full flow.",
      },
      {
        title: "Budget the frame",
        body: "A device profile sets pixel ratio, mesh segments and grain frame rate. Later sections mount only when they are 1,200 to 1,400 pixels away.",
      },
    ],
    media: {
      src: "/work/orion-detail.webp",
      alt: "ORION BLACK work chapter with a tattoo image and a large 02 Philosophy marker",
      caption: "Section two. The work strip and the philosophy chapter.",
    },
    outcome: {
      statement: "Four chapters, one continuous scroll.",
      body: "The site launched as ORION/INK and now runs as ORION BLACK. The full scroll, shader and booking flow ship as one React 19 build.",
    },
    facts: [
      { label: "Chapters", value: "04" },
      { label: "Shader", value: "6-octave FBM" },
      { label: "Build", value: "React 19 + Vite 7" },
      { label: "Stars", value: "16 on GitHub" },
    ],
    stack: ["React 19", "Vite 7", "Three.js", "GLSL", "GSAP", "Lenis"],
    url: "https://orion-ink.netlify.app",
    repo: "https://github.com/VedantGupta19402/Orion-Ink",
    note: "Independent studio site. Built by Vedant Gupta.",
    hue: "#B57BFF",
    cover: "/work/orion-cover.webp",
    coverAlt: "ORION BLACK hero with a tattoo machine and the words Stories Written in Color",
  },
  {
    id: "bugatti",
    name: "BUGATTI CANVAS",
    blurb: "A 240-frame canvas scroll study of a Chiron, scrubbed by hand.",
    category: "Scroll Experience",
    status: "DEMO",
    statusNote: "Public repo · study",
    year: "2026",
    role: "Design and engineering · Vedant Gupta",
    lede: "An independent scroll study: a Chiron frame sequence drawn on canvas and scrubbed with GSAP ScrollTrigger.",
    brief: {
      statement: "A scroll can behave like a film strip.",
      body: "The project uses 240 preloaded frames and an HTML5 canvas. Scroll progress maps to a frame index, so the car moves without a video element or a network stall. The rest of the page uses the same restrained type and rules as the hero.",
    },
    chapters: [
      {
        title: "Preload everything",
        body: "All 240 frames load before the first draw. The sequence runs without a flicker, even on a slow connection.",
      },
      {
        title: "Draw by progress",
        body: "ScrollTrigger pins the hero and maps progress to a frame index. Each update clears the canvas and draws the next frame.",
      },
      {
        title: "Keep the page quiet",
        body: "A spec sheet and a short feature section carry the rest of the story, with the same grid and type scale throughout.",
      },
    ],
    outcome: {
      statement: "A film strip without a video file.",
      body: "The study is a public demo, not a Bugatti product. It exists to test how far a canvas sequence and a scroll timeline can go with plain React.",
    },
    facts: [
      { label: "Frames", value: "240" },
      { label: "Renderer", value: "Canvas 2D" },
      { label: "Motion", value: "GSAP ScrollTrigger" },
      { label: "Stack", value: "React + Vite" },
    ],
    stack: ["React", "Vite", "GSAP", "Lenis", "Canvas 2D", "Tailwind CSS"],
    repo: "https://github.com/VedantGupta19402/Bugatti-scroll-site",
    note: "Independent study. Not affiliated with Bugatti.",
    hue: "#9047FF",
    cover: "/work/bugatti-cover.webp",
    coverAlt: "Bugatti Chiron scroll study with giant CHIRON type on a cream engineering grid",
  },
] as const;

// ---- Products status table (awards-table rhythm, real statuses) ----
export const STATUS_ROWS = PRODUCTS.map((p) => ({
  name: p.name,
  category: p.category,
  status: p.status,
  url: p.url,
}));

// ---- Studio / about ----
export const STUDIO = {
  kicker: "THE STUDIO",
  statement1: { lead: "From possibility to a", caps: "working business." },
  paragraph:
    "We're a three-human studio in India — Prachetan on outreach, Vedant and Rishabh on product and engineering — building client products end-to-end, and shipping our own because studios should show, not tell. Opera is the stage where things debut.",
  pillars: [
    { index: "01", name: "STRATEGY", line: "The problem, the audience, the direction." },
    { index: "02", name: "DESIGN", line: "Clear identity, intuitive experience." },
    { index: "03", name: "TECHNOLOGY", line: "Products made for real use — and for what comes next." },
  ],
  scene2: { lead: "It starts", caps: "WITH WHY." },
  scene3: { lead: "Different expertise.", caps: "SHARED AMBITION." },
} as const;

// ---- Team ----
export type TeamMember = {
  id: string;
  name: string;
  role: string;
  tags: string[];
  github?: string;
  linkedin?: string; // ⟨PLACEHOLDER⟩ until supplied
  monogram: string;
};

export const TEAM: TeamMember[] = [
  {
    id: "prachetan",
    name: "Prachetan",
    role: "OUTREACH",
    tags: ["BD", "PARTNERSHIPS", "GTM"],
    linkedin: "⟨PLACEHOLDER: linkedin-prachetan⟩",
    monogram: "P",
  },
  {
    id: "vedant",
    name: "Vedant Gupta",
    role: "FULL-STACK",
    tags: ["WEBGL", "REACT 19", "MOTION"],
    github: "https://github.com/VedantGupta19402",
    linkedin: "⟨PLACEHOLDER: linkedin-vedant⟩",
    monogram: "VG",
  },
  {
    id: "rishabh",
    name: "Rishabh Tripathi",
    role: "FULL-STACK",
    tags: ["SYSTEMS", "AI & AGENTS", "PRODUCT"],
    github: "https://github.com/rishabhx29",
    linkedin: "https://in.linkedin.com/in/rishabh-tripathi-728a77317",
    monogram: "RT",
  },
] as const;

// ---- Footer / contact ----
export const CONTACT = {
  kicker: "START A CONVERSATION",
  line1: "Let's build",
  line2: "what comes next.",
  email: SITE.email,
  promise: "IST — REPLY < 24H ON WEEKDAYS",
  columns: [
    { title: "SITEMAP", links: NAV_LINKS },
    { title: "PRODUCTS", links: PRODUCTS.slice(0, 3).map((p) => ({ label: p.name, href: p.url ?? "#" })) },
  ],
} as const;

export const PLACEHOLDER_MARKER = "⟨PLACEHOLDER:";
