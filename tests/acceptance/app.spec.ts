import { test, expect, type Page } from '@playwright/test'

// ── Helpers ──────────────────────────────────────────────────

async function dismissInfo(page: Page) {
  await page.getByTestId('info-dismiss').click()
}

async function fillAudiogram(
  page: Page,
  values: Partial<Record<number, { left: number; right: number }>>,
) {
  for (const [hz, ears] of Object.entries(values) as [string, { left: number; right: number }][]) {
    await page.getByTestId(`input-left-${hz}`).fill(String(ears.left))
    await page.getByTestId(`input-right-${hz}`).fill(String(ears.right))
  }
}

// Default audiogram used across multiple tests:
//   avg losses: 250→40, 500→30, 1000→10, 2000→30, 4000→40, 8000→50
//   Half-gain + Boost → shifted: 250→15, 500→10, 1000→0, 2000→10, 4000→15, 8000→20
const AG1 = {
  250:  { left: 40, right: 40 },
  500:  { left: 30, right: 30 },
  1000: { left: 10, right: 10 },
  2000: { left: 30, right: 30 },
  4000: { left: 40, right: 40 },
  8000: { left: 50, right: 50 },
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await dismissInfo(page)
})

// ── Test 1: correct EQ values for a known audiogram ──────────

test('correct EQ values for known audiogram (half-gain, boost)', async ({ page }) => {
  // Half-gain: 250:20, 500:15, 1000:5, 2000:15, 4000:20, 8000:25
  // In-range min = 5 (1000 Hz); Boost pivot = 5
  // Shifted: 250→15.0, 500→10.0, 1000→0.0, 2000→10.0, 4000→15.0, 8000→20.0
  await fillAudiogram(page, AG1)

  await page.getByTestId('mode-selector').click()
  await page.getByTestId('mode-option-boost').click()

  await expect(page.getByTestId('band-knob-1000')).toHaveAttribute('data-value', '0.0')
  await expect(page.getByTestId('band-knob-250')).toHaveAttribute('data-value', '15.0')
  await expect(page.getByTestId('band-knob-500')).toHaveAttribute('data-value', '10.0')
  await expect(page.getByTestId('band-knob-2000')).toHaveAttribute('data-value', '10.0')
  await expect(page.getByTestId('band-knob-4000')).toHaveAttribute('data-value', '15.0')
  await expect(page.getByTestId('band-knob-8000')).toHaveAttribute('data-value', '20.0')
})

// ── Test 2: values update when formula changes ────────────────

test('displayed values update when formula changes', async ({ page }) => {
  await fillAudiogram(page, AG1)

  await page.getByTestId('mode-selector').click()
  await page.getByTestId('mode-option-boost').click()

  // Default is Half-gain; 250 Hz should be 15.0
  await expect(page.getByTestId('band-knob-250')).toHaveAttribute('data-value', '15.0')

  // Switch to Ideal
  await page.getByTestId('formula-selector').click()
  await page.getByTestId('formula-option-ideal').click()

  // Ideal: 250:40, 500:30, 1000:10, 2000:30, 4000:40, 8000:50
  // Pivot = 10; shifted: 250→30.0, 1000→0.0, 8000→40.0
  await expect(page.getByTestId('band-knob-250')).toHaveAttribute('data-value', '30.0')
  await expect(page.getByTestId('band-knob-1000')).toHaveAttribute('data-value', '0.0')
  await expect(page.getByTestId('band-knob-8000')).toHaveAttribute('data-value', '40.0')
})

// ── Test 3: mode switch shifts all values, spreads preserved ──

test('mode switch shifts values while preserving relative spreads', async ({ page }) => {
  await fillAudiogram(page, AG1)

  // Switch to Boost (default is now Headroom-safe)
  await page.getByTestId('mode-selector').click()
  await page.getByTestId('mode-option-boost').click()

  // Boost: 8000→20.0, 1000→0.0
  await expect(page.getByTestId('band-knob-8000')).toHaveAttribute('data-value', '20.0')
  await expect(page.getByTestId('band-knob-1000')).toHaveAttribute('data-value', '0.0')

  // Switch to Headroom-safe
  await page.getByTestId('mode-selector').click()
  await page.getByTestId('mode-option-headroom-safe').click()

  // HeadroomSafe: half-gain corrections [20,15,5,15,20,25], spread=20 > range(12) → overflow rescue
  // pivot = min(25, 5+12) = 17 → shifted: 8000→8.0, 1000→-12.0, 250→3.0
  await expect(page.getByTestId('band-knob-8000')).toHaveAttribute('data-value', '8.0')
  await expect(page.getByTestId('band-knob-1000')).toHaveAttribute('data-value', '-12.0')
  await expect(page.getByTestId('band-knob-250')).toHaveAttribute('data-value', '3.0')
})

// ── Test 4: red warning when spread > 15 dB ──────────────────

test('red warning appears when spread exceeds 15 dB', async ({ page }) => {
  // 4000 Hz: avg 60, half-gain 30; others 0 → spread 30 > 15 → red
  // cappedCorrection = 0 + 15 = 15 dB > range(12) → capped knob suppressed (not achievable)
  // Red warning shown via limit knob + red overflow chevron instead
  await fillAudiogram(page, {
    250:  { left: 0, right: 0 },
    500:  { left: 0, right: 0 },
    1000: { left: 0, right: 0 },
    2000: { left: 0, right: 0 },
    4000: { left: 60, right: 60 },
    8000: { left: 0, right: 0 },
  })

  await page.getByTestId('mode-selector').click()
  await page.getByTestId('mode-option-boost').click()

  await expect(page.getByTestId('band-knob-4000')).toHaveAttribute('data-warning', 'red')
  await expect(page.getByTestId('band-knob-capped-4000')).not.toBeVisible()
  await expect(page.getByTestId('band-knob-limit-4000')).toBeVisible()
  await expect(page.getByTestId('band-overflow-chevron-4000')).toBeVisible()
  // Limit knob sits at 12 dB (iso10 range); its spread = 12 − 0 = 12 → yellow, not red
  await expect(page.getByTestId('band-knob-limit-4000')).toHaveAttribute('data-warning', 'yellow')
})

// ── Test 5: yellow warning when spread is 10–15 dB ───────────

test('yellow warning appears when spread is between 10 and 15 dB', async ({ page }) => {
  // 4000 Hz: avg 30, half-gain 15; others 0 → spread 15 > 10, ≤ 15 → yellow
  await fillAudiogram(page, {
    250:  { left: 0, right: 0 },
    500:  { left: 0, right: 0 },
    1000: { left: 0, right: 0 },
    2000: { left: 0, right: 0 },
    4000: { left: 30, right: 30 },
    8000: { left: 0, right: 0 },
  })

  await expect(page.getByTestId('band-knob-4000')).toHaveAttribute('data-warning', 'yellow')
  await expect(page.getByTestId('band-knob-capped-4000')).not.toBeVisible()
})

// ── Test 6: extrapolated bands show Estimated label ───────────

test('bands outside the tested frequency range are marked as Estimated', async ({ page }) => {
  // Only fill 1000–4000; bands at 31, 62, 125, 250, 500, 8000, 16000 are extrapolated
  await fillAudiogram(page, {
    1000: { left: 20, right: 20 },
    2000: { left: 20, right: 20 },
    4000: { left: 20, right: 20 },
  })

  // iso10 preset includes 31 Hz (well outside tested range)
  await expect(page.getByTestId('band-estimated-label-31')).toBeVisible()
  await expect(page.getByTestId('band-extrapolated-icon-31')).toBeVisible()

  // 1000 Hz is in range — should NOT have Estimated label
  await expect(page.getByTestId('band-estimated-label-1000')).not.toBeVisible()
})

// ── Test 7: reference band gets golden ear + Reference label ──

test('band with least hearing loss shows golden ear icon and Reference label', async ({ page }) => {
  // 1000 Hz has uniquely least loss (10 dB)
  await fillAudiogram(page, AG1)

  await expect(page.getByTestId('band-reference-icon-1000')).toBeVisible()
  await expect(page.getByTestId('band-reference-label-1000')).toBeVisible()

  // Other in-range bands should NOT have reference markers
  await expect(page.getByTestId('band-reference-icon-250')).not.toBeVisible()
  await expect(page.getByTestId('band-reference-label-250')).not.toBeVisible()
})

// ── Test 8: tied reference bands both get icon and label ──────

test('all tied bands with least hearing loss receive the reference marker', async ({ page }) => {
  // 1000 Hz and 2000 Hz are tied at 10 dB loss
  await fillAudiogram(page, {
    250:  { left: 40, right: 40 },
    500:  { left: 30, right: 30 },
    1000: { left: 10, right: 10 },
    2000: { left: 10, right: 10 },
    4000: { left: 40, right: 40 },
    8000: { left: 50, right: 50 },
  })

  await expect(page.getByTestId('band-reference-icon-1000')).toBeVisible()
  await expect(page.getByTestId('band-reference-icon-2000')).toBeVisible()
  await expect(page.getByTestId('band-reference-label-1000')).toBeVisible()
  await expect(page.getByTestId('band-reference-label-2000')).toBeVisible()
})

// ── Test 9: limit knob + overflow chevron when correction exceeds EQ range ──

test('limit knob and overflow chevron appear when correction exceeds EQ range', async ({ page }) => {
  // Tesla preset (±8 dB) + Ideal formula
  // Audiogram: 0 dB except 4000 Hz at 20 dB
  // 5500 Hz band interpolates between 4000=20 and 8000=0 → ~11.7 dB ideal correction
  // 11.7 dB > range(8) → out of range

  // Fill audiogram first — preset selector only appears once ≥2 frequencies are entered
  await fillAudiogram(page, {
    250:  { left: 0,  right: 0  },
    500:  { left: 0,  right: 0  },
    1000: { left: 0,  right: 0  },
    2000: { left: 0,  right: 0  },
    4000: { left: 20, right: 20 },
    8000: { left: 0,  right: 0  },
  })

  await page.getByTestId('preset-selector').click()
  await page.getByTestId('preset-option-tesla5').click()
  await page.getByTestId('formula-selector').click()
  await page.getByTestId('formula-option-ideal').click()
  await page.getByTestId('mode-selector').click()
  await page.getByTestId('mode-option-boost').click()

  // Limit knob at range boundary and overflow chevron must be visible
  await expect(page.getByTestId('band-knob-limit-5500')).toBeVisible()
  await expect(page.getByTestId('band-overflow-chevron-5500')).toBeVisible()

  // Primary knob is replaced — not visible (kept in DOM for data-value access)
  await expect(page.getByTestId('band-knob-5500')).not.toBeVisible()

  // Limit knob sits at 8 dB (Tesla range); its spread = 8 − 0 = 8 → none, not red
  await expect(page.getByTestId('band-knob-limit-5500')).toHaveAttribute('data-warning', 'none')
})

// ── Test 10: no limit knob when correction is within EQ range ──

test('limit knob absent when all corrections are within EQ range', async ({ page }) => {
  // iso10 (±12 dB) + Half-gain (defaults)
  // Uniform 10 dB loss → all ideal corrections = 5 dB, shifted to 0 dB — well within ±12 dB
  await fillAudiogram(page, {
    250:  { left: 10, right: 10 },
    500:  { left: 10, right: 10 },
    1000: { left: 10, right: 10 },
    2000: { left: 10, right: 10 },
    4000: { left: 10, right: 10 },
    8000: { left: 10, right: 10 },
  })

  await expect(page.getByTestId('band-knob-limit-1000')).not.toBeVisible()
  await expect(page.getByTestId('band-overflow-chevron-1000')).not.toBeVisible()
  await expect(page.getByTestId('band-knob-1000')).toBeVisible()
})
