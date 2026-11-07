"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

/* reference MenuLink decode: 400 ms, 10-char wave, 10 fps scramble,
   violet ramp resolving to the base colour */
const CHARSET = "[]{}!@#$%^&*_+-=|;:<>?/~0123456789";
const ACCENT = "#b366ff";
const DURATION_MS = 400;
const WAVE = 10;
const SCRAMBLE_FPS = 10;
const SCRAMBLE_END = 0.5;
const ACCENT_END = 0.75;
const WORD_PAUSE = 0.12;

type Entry = {
  char: string;
  space: boolean;
  charIndex: number;
  wordAccum: number;
};

function parseText(text: string) {
  const parts = text.split(/(\s+)/);
  const entries: Entry[] = [];
  let charIndex = 0;
  let wordAccum = 0;
  let gapsSeen = 0;
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      entries.push({ char: part, space: true, charIndex: -1, wordAccum });
      gapsSeen++;
      continue;
    }
    if (gapsSeen > 0) wordAccum += WORD_PAUSE;
    for (const char of part) {
      entries.push({ char, space: false, charIndex, wordAccum });
      charIndex++;
    }
  }
  return { entries, charCount: charIndex, wordGaps: Math.max(0, gapsSeen - 1) };
}

function scramble(index: number, frame: number) {
  const h = ((index * 2654435761) ^ (frame * 340573321)) >>> 0;
  return CHARSET[h % CHARSET.length];
}

export default function DecodeLink({
  href,
  text,
  className,
}: {
  href: string;
  text: string;
  className?: string;
}) {
  const { entries, charCount, wordGaps } = useMemo(() => parseText(text), [text]);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);
  const frame = useRef<number | null>(null);

  const reset = useCallback(() => {
    entries.forEach((entry, i) => {
      const el = spans.current[i];
      if (!el || entry.space) return;
      el.textContent = entry.char;
      el.style.opacity = "1";
      el.style.color = "";
    });
  }, [entries]);

  const play = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const total = charCount + WORD_PAUSE * wordGaps + WAVE;
    const start = performance.now();
    const step = (now: number) => {
      const t = now - start;
      const s = Math.min(t / DURATION_MS, 1);
      const x = s * total;
      const f = Math.floor((t / 1000) * SCRAMBLE_FPS);
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const el = spans.current[i];
        if (!el || entry.space) continue;
        const m = (x - (entry.charIndex + entry.wordAccum)) / WAVE;
        if (m <= 0) {
          el.style.opacity = "0";
          continue;
        }
        el.style.opacity = "1";
        if (m < SCRAMBLE_END) {
          el.style.color = ACCENT;
          el.textContent = scramble(entry.charIndex, f);
        } else if (m < ACCENT_END) {
          el.style.color = ACCENT;
          el.textContent = entry.char;
        } else {
          el.style.color = "";
          el.textContent = entry.char;
        }
      }
      if (s < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        frame.current = null;
        reset();
      }
    };
    frame.current = requestAnimationFrame(step);
  }, [charCount, entries, reset, wordGaps]);

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    reset();
  }, [reset]);

  useEffect(() => stop, [stop]);

  return (
    <a
      href={href}
      className={className}
      aria-label={text}
      onMouseEnter={play}
      onMouseLeave={stop}
    >
      {entries.map((entry, i) => (
        <span
          key={i}
          aria-hidden="true"
          ref={(el) => {
            spans.current[i] = el;
          }}
        >
          {entry.char}
        </span>
      ))}
    </a>
  );
}
