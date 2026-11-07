/**
 * Raw scroll → journey progress.
 *
 * The five stations were tuned on a 620vh hero (520vh of travel). The finale —
 * torus hold, dive and ring reveal — read too fast at that length, so the hero
 * is taller and this mapping gives the extra runway to the finale only. The
 * first four stations keep their original scroll distances: raw progress up to
 * the torus arrives at the same pixels as before, then journey progress eases
 * through a longer hold, dive and reveal.
 */
export const HERO_VH = 820;

const RANGE_VH = HERO_VH - 100;
const STATIONS_VH = 520 * 0.76; // 395.2vh: the station journey on the old hero

// finale segments, in viewport heights of scroll
const HOLD_VH = 70;
const DIVE_VH = 125;
const REVEAL_VH = 100;

const ANCHORS = [
  { raw: 0, q: 0 },
  { raw: STATIONS_VH / RANGE_VH, q: 0.76 },
  { raw: (STATIONS_VH + HOLD_VH) / RANGE_VH, q: 0.88 },
  { raw: (STATIONS_VH + HOLD_VH + DIVE_VH) / RANGE_VH, q: 0.94 },
  { raw: (STATIONS_VH + HOLD_VH + DIVE_VH + REVEAL_VH) / RANGE_VH, q: 0.99 },
  { raw: 1, q: 1 },
];

export function journeyProgress(raw: number): number {
  if (raw <= 0) return 0;
  if (raw >= 1) return 1;
  for (let i = 1; i < ANCHORS.length; i++) {
    const a = ANCHORS[i - 1];
    const b = ANCHORS[i];
    if (raw <= b.raw) {
      const k = (raw - a.raw) / (b.raw - a.raw);
      return a.q + (b.q - a.q) * k;
    }
  }
  return 1;
}
