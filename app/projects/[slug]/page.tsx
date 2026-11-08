import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";
import SmoothScroll from "@/components/ui/SmoothScroll";
import CaseReveal from "@/components/ui/CaseReveal";
import { PRODUCTS } from "@/content/opera";

type Params = { slug: string };

// cacheComponents wants a blocking route here: all five cases are prerendered.
export const instant = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = PRODUCTS.find((p) => p.id === slug);
  if (!project) return { title: "Case not found — Opera" };
  return {
    title: `${project.name} — Opera`,
    description: project.lede,
    openGraph: {
      title: `${project.name} — Opera`,
      description: project.lede,
      images: [project.cover],
      type: "article",
    },
  };
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mono-label text-[color:var(--muted)]">{label}</dt>
      <dd className="mt-2 text-sm leading-relaxed text-[color:var(--paper)]/85">{value}</dd>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-6 border-b border-[color:var(--hairline)] py-4 md:grid-cols-[10rem_1fr]">
      <dt className="mono-label text-[color:var(--muted)]">{label.toUpperCase()}</dt>
      <dd className="min-w-0 wrap-anywhere text-sm leading-relaxed text-[color:var(--paper)]/85">{value}</dd>
    </div>
  );
}

function externalLabel(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const index = PRODUCTS.findIndex((p) => p.id === slug);
  if (index < 0) notFound();
  const project = PRODUCTS[index];
  const next = PRODUCTS[(index + 1) % PRODUCTS.length];
  const live = project.status === "LIVE";

  return (
    <main id="main" className="bg-[color:var(--ink)]">
      <Nav />
      <SmoothScroll />

      <CaseReveal>
        <article>
          <header className="relative px-6 pb-14 pt-32 md:px-12 md:pb-16 md:pt-44">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between gap-6">
                <Link
                  href="/#work"
                  className="mono-label group inline-flex items-center gap-2 text-[color:var(--muted)] transition-colors hover:text-[color:var(--paper)]"
                >
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:-translate-x-1"
                  >
                    ←
                  </span>
                  ALL WORK
                </Link>
                <span className="mono-label text-[color:var(--muted)]">
                  CASE {String(index + 1).padStart(2, "0")} / {String(PRODUCTS.length).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-14 grid items-end gap-10 md:mt-20 md:grid-cols-[1.4fr_0.6fr] md:gap-14">
                <div>
                  <div data-reveal className="flex flex-wrap items-center gap-3">
                    <span className="mono-label flex items-center gap-2 rounded-full border border-[color:var(--hairline)] px-3 py-1.5 text-[color:var(--paper)]">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          live ? "bg-[color:var(--ok)]" : "bg-[color:var(--violet-2)]"
                        }`}
                      />
                      {project.status}
                    </span>
                    <span className="mono-label text-[color:var(--violet-2)]">
                      {project.category}
                    </span>
                  </div>
                  <h1
                    data-reveal
                    className="display mt-6 text-balance text-[clamp(3rem,10vw,8.6rem)] leading-[0.88] text-[color:var(--paper)]"
                  >
                    {project.name}
                  </h1>
                </div>

                <div data-reveal className="md:pb-2">
                  <p className="text-base leading-relaxed text-[color:var(--paper)]/85 md:text-lg">
                    {project.lede}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener"
                        className="mono-label inline-flex items-center gap-2 rounded-full bg-[color:var(--paper)] px-5 py-3 text-[color:var(--ink)] transition-transform duration-150 hover:-translate-y-0.5"
                      >
                        VISIT LIVE <span aria-hidden="true">↗</span>
                      </a>
                    )}
                    {project.repo && (
                      <a
                        href={project.repo}
                        target="_blank"
                        rel="noopener"
                        className="mono-label inline-flex items-center gap-2 rounded-full border border-[color:var(--hairline)] px-5 py-3 text-[color:var(--paper)] transition-colors duration-200 hover:border-[color:var(--violet-2)]"
                      >
                        SOURCE <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div
                data-reveal-media
                className="relative mt-14 aspect-[4/3] overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--ink-2)] md:mt-20 md:aspect-[16/9]"
              >
                <Image
                  src={project.cover}
                  alt={project.coverAlt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 1280px"
                  className="object-cover object-top"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0b0913]/55 via-transparent to-transparent"
                />
                <span className="mono-label absolute bottom-4 left-4 rounded-full border border-white/10 bg-[color:var(--ink)]/60 px-3 py-1.5 text-[color:var(--paper)]/80 backdrop-blur-sm">
                  {project.statusNote}
                </span>
              </div>

              <dl className="hairline-t mt-8 grid grid-cols-2 gap-x-6 gap-y-7 pt-7 md:grid-cols-4">
                <Meta label="ROLE" value={project.role} />
                <Meta label="YEAR" value={project.year} />
                <Meta label="STACK" value={project.stack.slice(0, 3).join(" · ")} />
                <Meta label="STATUS" value={project.statusNote} />
              </dl>
            </div>
          </header>

          <section className="hairline-t px-6 py-24 md:px-12 md:py-32">
            <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.32fr_1fr] md:gap-16">
              <p className="mono-label text-[color:var(--violet-2)]">01 / THE BRIEF</p>
              <div data-reveal-scroll>
                <p className="display text-[clamp(2rem,4.6vw,4.2rem)] leading-[1.02] text-[color:var(--paper)]">
                  {project.brief.statement}
                </p>
                <p className="mt-8 max-w-2xl text-base leading-relaxed text-[color:var(--muted)]">
                  {project.brief.body}
                </p>
              </div>
            </div>
          </section>

          <section className="hairline-t px-6 py-24 md:px-12 md:py-32">
            <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.32fr_1fr] md:gap-16">
              <p className="mono-label text-[color:var(--violet-2)]">02 / INSIDE THE BUILD</p>
              <ol className="border-t border-[color:var(--hairline)]">
                {project.chapters.map((chapter, i) => (
                  <li
                    key={chapter.title}
                    data-reveal-scroll
                    className="border-b border-[color:var(--hairline)] py-8 md:py-10"
                  >
                    <div className="grid gap-4 md:grid-cols-[3rem_1fr_1.1fr] md:gap-8">
                      <span className="mono-label text-[color:var(--muted)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h2 className="display text-[clamp(1.5rem,2.6vw,2.1rem)] leading-tight text-[color:var(--paper)]">
                        {chapter.title}
                      </h2>
                      <p className="text-sm leading-relaxed text-[color:var(--muted)]">
                        {chapter.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {project.media && (
            <figure className="px-6 pb-24 md:px-12 md:pb-32">
              <div data-reveal-scroll className="mx-auto max-w-7xl">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--ink-2)]">
                  <Image
                    src={project.media.src}
                    alt={project.media.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 1280px"
                    className="object-cover object-top"
                  />
                </div>
                <figcaption className="mono-label mt-4 text-[color:var(--muted)]">
                  {project.media.caption}
                </figcaption>
              </div>
            </figure>
          )}

          <section className="hairline-t px-6 py-24 md:px-12 md:py-32">
            <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.32fr_1fr] md:gap-16">
              <p className="mono-label text-[color:var(--violet-2)]">03 / OUTCOME</p>
              <div data-reveal-scroll>
                <p className="display text-[clamp(2rem,4.6vw,4.2rem)] leading-[1.02] text-[color:var(--paper)]">
                  {project.outcome.statement}
                </p>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--muted)]">
                  {project.outcome.body}
                </p>
                <dl className="mt-12 grid grid-cols-2 gap-8 border-t border-[color:var(--hairline)] pt-8 md:grid-cols-4">
                  {project.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt className="mono-label text-[color:var(--muted)]">{fact.label}</dt>
                      <dd className="display mt-2 text-2xl text-[color:var(--paper)]">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          <section className="hairline-t px-6 py-24 md:px-12 md:py-32">
            <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.32fr_1fr] md:gap-16">
              <p className="mono-label text-[color:var(--violet-2)]">04 / SPECS</p>
              <div data-reveal-scroll>
                <dl>
                  <SpecRow label="Year" value={project.year} />
                  <SpecRow label="Role" value={project.role} />
                  <SpecRow label="Stack" value={project.stack.join(" · ")} />
                  <SpecRow label="Type" value={project.category} />
                  <SpecRow label="Status" value={project.statusNote} />
                  {project.url && (
                    <SpecRow
                      label="Live"
                      value={
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener"
                          className="underline decoration-[color:var(--hairline)] underline-offset-4 transition-colors hover:text-[color:var(--violet-2)]"
                        >
                          {externalLabel(project.url)} ↗
                        </a>
                      }
                    />
                  )}
                  {project.repo && (
                    <SpecRow
                      label="Source"
                      value={
                        <a
                          href={project.repo}
                          target="_blank"
                          rel="noopener"
                          className="underline decoration-[color:var(--hairline)] underline-offset-4 transition-colors hover:text-[color:var(--violet-2)]"
                        >
                          {externalLabel(project.repo)} ↗
                        </a>
                      }
                    />
                  )}
                  {project.npm && (
                    <SpecRow
                      label="Package"
                      value={
                        <a
                          href={project.npm}
                          target="_blank"
                          rel="noopener"
                          className="underline decoration-[color:var(--hairline)] underline-offset-4 transition-colors hover:text-[color:var(--violet-2)]"
                        >
                          traceon-analyzer ↗
                        </a>
                      }
                    />
                  )}
                </dl>
                {project.note && (
                  <p className="mono-label mt-6 text-[color:var(--muted)]">{project.note}</p>
                )}
              </div>
            </div>
          </section>

          <section className="hairline-t px-6 py-24 md:px-12 md:py-32">
            <div className="mx-auto max-w-7xl">
              <p className="mono-label text-[color:var(--violet-2)]">NEXT CASE</p>
              <Link
                href={`/projects/${next.id}`}
                data-case-link
                data-case-label={next.name}
                className="group mt-8 grid items-center gap-10 md:grid-cols-[1fr_0.8fr] md:gap-16"
              >
                <div>
                  <h2 className="display text-[clamp(2.6rem,7vw,6rem)] leading-[0.92] text-[color:var(--paper)] transition-colors duration-300 group-hover:text-[color:var(--violet-2)]">
                    {next.name}
                  </h2>
                  <p className="mono-label mt-4 text-[color:var(--muted)]">{next.category}</p>
                  <p className="mt-5 max-w-md text-sm leading-relaxed text-[color:var(--muted)]">
                    {next.blurb}
                  </p>
                  <span className="mono-label mt-8 inline-flex items-center gap-2 text-[color:var(--paper)]">
                    OPEN CASE
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--ink-2)]">
                  <Image
                    src={next.cover}
                    alt={next.coverAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-cover object-center grayscale transition-[filter,transform] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.02] group-hover:grayscale-0"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-35 mix-blend-color transition-opacity duration-700 group-hover:opacity-0"
                    style={{ backgroundColor: next.hue }}
                  />
                </div>
              </Link>
            </div>
          </section>
        </article>

        <Footer />
      </CaseReveal>
    </main>
  );
}
