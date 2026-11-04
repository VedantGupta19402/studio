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
  shape: "swirl" | "egg" | "cube" | "sphere" | "tree" | "ring";
};

export const HERO_SCENES: HeroScene[] = [
  { id: "s1", lead: "We don't pitch.", caps: "WE SHIP.", shape: "swirl" },
  { id: "s2", lead: "We", caps: "BUILD CLIENT PRODUCTS —\nAND SHIP OUR OWN.", shape: "egg" },
  { id: "s3", mono: "PROOF", caps: "LIVE, LINKABLE,\nRUNNING.", shape: "cube" },
  { id: "s4", lead: "Small team.", caps: "SERIOUS CRAFT.", shape: "sphere" },
  { id: "s5", lead: "Every product", caps: "DESERVES A PREMIERE.", shape: "ring" },
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

// ---- Products & builds (real data — spec §2) ----
export type Product = {
  id: string;
  name: string;
  blurb: string;
  category: string;
  status: "LIVE" | "DEMO";
  url?: string;
  monogram: string;
  hue: string; // card glow hue
};

export const PRODUCTS: Product[] = [
  {
    id: "traceon",
    name: "Traceon",
    blurb: "Codebase intelligence — AST dependency graphs, impact analysis, LLM engineering DNA.",
    category: "Developer Tools / AI",
    status: "LIVE",
    url: "https://traceon.vercel.app",
    monogram: "T",
    hue: "#9047FF",
  },
  {
    id: "velokey",
    name: "VeloKey",
    blurb: "Distraction-free typing test — solo drills and live multiplayer races.",
    category: "Open-source Web App",
    status: "LIVE",
    url: "https://velokey.app",
    monogram: "V",
    hue: "#B57BFF",
  },
  {
    id: "thriftdex",
    name: "ThriftDex",
    blurb: "Premium vintage & archive clothing — 1-of-1 drops, sourced and authenticated.",
    category: "E-commerce / Fashion",
    status: "LIVE",
    url: "https://thrift-dex.vercel.app",
    monogram: "X",
    hue: "#7FE08A",
  },
  {
    id: "orion-ink",
    name: "ORION/INK",
    blurb: "Cinematic scroll-driven studio experience — custom GLSL ink shaders.",
    category: "WebGL Experience",
    status: "DEMO",
    url: "https://orion-ink.netlify.app",
    monogram: "O/I",
    hue: "#B57BFF",
  },
  {
    id: "bugatti",
    name: "BUGATTI CANVAS",
    blurb: "A Bugatti-inspired scroll — canvas-driven motion.",
    category: "Scroll Experience",
    status: "DEMO",
    url: "https://github.com/VedantGupta19402/Bugatti-scroll-site",
    monogram: "B",
    hue: "#9047FF",
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
