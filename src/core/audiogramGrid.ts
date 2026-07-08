import { type Audiogram } from './pipeline'

// Full-weight tick columns — the standard clinical octave set. Visual treatment only;
// not all of these are pre-populated by default (see DEFAULT_FREQUENCIES).
export const OCTAVE_FREQUENCIES = [125, 250, 500, 1000, 2000, 4000, 8000]

// Subset of OCTAVE_FREQUENCIES that is pre-populated at 0 dB HL on mount.
// 125 Hz is deliberately excluded — it starts unset, like the interoctave columns.
export const DEFAULT_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000]

// Optional columns shown as lighter/thinner ticks, unpopulated until clicked.
export const INTEROCTAVE_FREQUENCIES = [750, 1500, 3000, 6000]

export const ALL_FREQUENCIES = [...OCTAVE_FREQUENCIES, ...INTEROCTAVE_FREQUENCIES].sort(
  (a, b) => a - b,
)

export const DB_MIN = -10 // top of the chart
export const DB_MAX = 110 // bottom of the chart
export const DB_SNAP = 5 // clinical snap increment

export const GRID_WIDTH = 320 // px — per-chart plot width
export const GRID_HEIGHT = 320 // px — per-chart plot height

const MIN_HZ = ALL_FREQUENCIES[0]
const MAX_HZ = ALL_FREQUENCIES[ALL_FREQUENCIES.length - 1]

// Log-scale X mapping. hzToX(125) === 0, hzToX(8000) === GRID_WIDTH.
export function hzToX(hz: number): number {
  const t = Math.log(hz / MIN_HZ) / Math.log(MAX_HZ / MIN_HZ)
  return t * GRID_WIDTH
}

// Linear dB -> Y mapping. Increasing dB moves DOWN (clinical convention).
// dbToY(-10) === 0 (top), dbToY(110) === GRID_HEIGHT (bottom). Clamps outside [DB_MIN, DB_MAX].
export function dbToY(db: number): number {
  const clamped = Math.max(DB_MIN, Math.min(DB_MAX, db))
  return ((clamped - DB_MIN) / (DB_MAX - DB_MIN)) * GRID_HEIGHT
}

// Inverse of dbToY, used to translate a pointer's pixel Y back into a dB value.
// Clamps to the pixel range first, then snaps the result to the nearest 5 dB.
export function yToDb(y: number): number {
  const clampedY = Math.max(0, Math.min(GRID_HEIGHT, y))
  const raw = DB_MIN + (clampedY / GRID_HEIGHT) * (DB_MAX - DB_MIN)
  return snapDb(raw)
}

// Snaps an arbitrary dB value to the nearest 5 dB increment, then clamps to [DB_MIN, DB_MAX].
export function snapDb(db: number): number {
  const snapped = Math.round(db / DB_SNAP) * DB_SNAP
  return Math.max(DB_MIN, Math.min(DB_MAX, snapped)) + 0 // normalize -0 to 0
}

export function isOctave(hz: number): boolean {
  return (OCTAVE_FREQUENCIES as number[]).includes(hz)
}

type EarRow = { left: number | null; right: number | null }

// Only includes an hz entry when BOTH ears are non-null — same both-ears-required rule
// the old typed-number form used, generalized over whatever keys happen to be present.
export function buildAudiogram(rows: Partial<Record<number, EarRow>>): Audiogram {
  const audiogram: Audiogram = {}
  for (const [hzStr, row] of Object.entries(rows)) {
    if (!row) continue
    if (row.left !== null && row.right !== null) {
      audiogram[Number(hzStr)] = { left: row.left, right: row.right }
    }
  }
  return audiogram
}

// Pixel-space styling for a straight connecting line between two plotted points, using the
// "rotated div" CSS technique (no SVG, consistent with the rest of the app).
export function segmentStyle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): { left: number; top: number; width: number; angleDeg: number } {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return {
    left: p1.x,
    top: p1.y,
    width: Math.sqrt(dx * dx + dy * dy),
    angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI,
  }
}
