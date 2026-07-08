# Audiogram-to-Equalizer Advisor — Project Context

This file is the persistent reference for Claude Code across all sessions on this project.
The full specification and development plan is in `Audiogram_EQ_Project_Plan_v3.docx`.
When in doubt, the plan document is the source of truth. Flag ambiguities — do not silently resolve them.

---

## What this project is

A fully client-side web application that converts audiogram data (hearing thresholds in dB HL)
into suggested equalizer settings for consumer audio equipment (TV, computer, car audio).

- No backend. No server. No data leaves the user's computer. Ever.
- No audio processing or playback. Output is advisory numbers only.
- No clinical claims. This is exploratory and informational.

---

## Core specification (binding — do not invent or adjust these values)

### Formulas

Three selectable formulas. Applied to the simple arithmetic average of left/right ear thresholds
per frequency before any formula runs.

| Formula     | Rule                                              |
|-------------|---------------------------------------------------|
| Ideal       | gain = 100% of measured dB HL loss                |
| Half-gain   | gain = 50% of measured dB HL loss                 |
| Loss-adjusted | gain = tiered fraction (see table below)        |

**Loss-adjusted tier table (exhaustively test every boundary):**

| Measured loss    | Fraction |
|------------------|----------|
| 0–20 dB HL       | 0%       |
| 21–40 dB HL      | 50%      |
| 41–60 dB HL      | 40%      |
| 61–80 dB HL      | 30%      |
| 81+ dB HL        | 25%      |

### Spread-based warning system

Spread = (band's correction value) − (reference band's correction value)
Reference band = the band with the least measured hearing loss.

| Spread         | Treatment                              |
|----------------|----------------------------------------|
| ≤ 10 dB        | Normal display                         |
| > 10 dB        | Yellow warning on knob                 |
| > 15 dB        | Red warning on knob                    |
| > 15 dB        | Safety-adjusted value capped at 15 dB  |

Both the raw value and the safety-adjusted value are shown via overlapping knobs on the same slider.
These thresholds apply identically in both display modes.

### Display modes

Both modes apply a pure vertical shift to the same underlying correction curve.
The spread between any two bands is identical in both modes.

- **Boost mode**: reference band (least loss) sits at 0 dB; all other bands are positive.
- **Headroom-safe mode**: band with most loss sits at 0 dB; all other bands are negative.

### Reference band marking

- Golden ear icon on the knob of the band with the least measured hearing loss.
- "Reference" text label beneath that band's frequency tick.
- If multiple bands tie for least loss, all tied bands receive both the icon and the label.

### Audiogram chart grid conventions

Source: ASHA, ["Guidelines for Audiometric Symbols"](https://www.asha.org/policy/gl1990-00006/) (1990,
policy doc `GL1990-00006`) — a standalone ASHA policy guideline, not part of a larger manual.

- Grid lines are of equal darkness and thickness at octave frequency intervals (X-axis) and at
  10 dB HL intervals (Y-axis) — the two axes' gridlines should look visually consistent with each
  other, not just internally among themselves.
- The 0 dB HL line is the one deliberate exception: it must be shown prominently so it stands out
  from the other HL grid lines. The exact rendering technique isn't specified by ASHA; this project
  renders it wider and darker than the plain 10 dB gridlines (project owner rejected the
  "railroad track" flanking-lines variant tried earlier — plain weight/color emphasis only).
- This governs the interactive audiogram entry charts (`AudiogramEarChart.tsx`), not the equalizer
  output graphic (`EqGraphic.tsx`), which has its own separate visual language.

### Out-of-range frequencies

- Extrapolation method: trend-based — continue the slope of the last two tested points outward.
- Extrapolated bands (outside tested range): dimmed knob + question-mark icon + "Estimated" label.
- Interpolated bands (between two tested points): full opacity, no special treatment.

### Band-layout presets

| Preset                          | Bands | Center frequencies (Hz)                        | Range       |
|---------------------------------|-------|------------------------------------------------|-------------|
| Computer/software — 10-band ISO | 10    | 31, 62, 125, 250, 500, 1k, 2k, 4k, 8k, 16k    | ±12 dB      |
| TV — graphic EQ (Sony-style)    | 7     | 125, 250, 500, 1k, 2k, 4k, 8k                 | ±12 dB      |
| TV — graphic EQ (TCL-style)     | 7     | 100, 200, 500, 1k, 2k, 5k, 10k                | −10 to +10  |
| Tesla                           | 5     | ~30, 100, 350, 1300, 5500                      | ±8 dB       |

**Default on first load: Computer/software — 10-band ISO.**

Tesla note: center frequencies are from independent owner RTA measurements, not official Tesla
documentation. Tesla does not publish these values officially.

### Selector and UI design

- Formula and mode are each selected via a single self-labeling control.
- In its closed state, the control displays the current selection and doubles as the caption
  for the equalizer graphic below it.
- Pros/cons text appears only when the selector is open — not after selection.
- No per-band text labels on the equalizer graphic.
- A single legend/color key is shown once near the graphic.

---

## Automated testing rules (non-negotiable)

1. **Test-first**: Layer 1 (unit) and Layer 2 (integration) tests are written from this spec
   BEFORE any application logic. Do not write implementation until the tests are approved.

2. **Test layers**:
   - Layer 1 — unit tests: each formula, spread calculation, mode shift, interpolation,
     and extrapolation in isolation. Expected values are calculated directly from the spec above.
   - Layer 2 — integration tests: full pipeline from audiogram input to final band values.
     Minimum 12 combinations: 3 formulas × 2 modes × 2 preset samples.
   - Layer 3 — acceptance tests: browser-driven UI behavior tests, written alongside the UI build.

3. **Boundary tests are mandatory** for the Loss-adjusted tier table:
   Test exactly at 20, 21, 40, 41, 60, 61, 80, and 81 dB HL.

4. **If a test fails**: fix the implementation, not the test — unless the test has been
   reviewed by the project owner and confirmed to be incorrect against this spec.

5. **No code is considered done** until its corresponding tests pass.

---

## Informational message (exact text — do not paraphrase)

Display once, prominently, on first use:

> Here's a simple idea worth knowing: many people with hearing loss can get noticeably better
> sound just by adjusting the equalizer already built into their TV, computer, or car stereo —
> no new equipment required.
>
> Why does that work? Your audiogram — the chart from your hearing test — shows which pitches
> are harder for you to pick up. Correcting for that usually just means nudging those particular
> pitches up a bit relative to everything else, and that's exactly what an equalizer lets you do.
>
> This tool takes your audiogram and turns it into a few suggested equalizer settings to try,
> based on the gear you already own.
>
> You'll find a few different ways to calculate these suggestions — try more than one if you like.
> They're starting points, not exact prescriptions, so trust your ears and keep adjusting from there.
>
> Worth knowing: if you're not the only one listening, your settings might not suit everyone else
> in the room. And your audiogram data stays on your computer — it's never sent anywhere.

---

## Things that are explicitly out of scope — do not implement

- Any backend, server, or network call of any kind
- Any audio processing, playback, or signal manipulation
- Any limiter, compressor, or clipping protection in code
- Clinical-grade fitting formulas (NAL-NL2, DSL, etc.)
- Custom user-defined equalizer band configuration (deferred to future release)
- Qualitative "raise a little / raise a lot" guidance for unlabeled controls (deferred)

---

## Stack constraint

The application must be fully client-side. When proposing a stack, ensure:
- No backend or server component of any kind
- All computation happens in the browser
- No data is sent over any network

Propose the stack (framework, language, test runner) and wait for approval before writing code.
