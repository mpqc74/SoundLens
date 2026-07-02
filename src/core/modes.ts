export const DisplayMode = {
  Boost:        'boost',
  HeadroomSafe: 'headroom-safe',
} as const
export type DisplayMode = typeof DisplayMode[keyof typeof DisplayMode]

export function applyMode(corrections: number[], mode: DisplayMode | string): number[] {
  if (mode === DisplayMode.HeadroomSafe) {
    const max = Math.max(...corrections)
    return corrections.map(c => c - max)
  }
  const min = Math.min(...corrections)
  return corrections.map(c => c - min)
}
