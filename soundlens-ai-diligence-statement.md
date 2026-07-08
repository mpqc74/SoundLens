# AI Diligence Statement — SoundLens

In building SoundLens (a tool that converts audiogram values into equalizer settings to help compensate for hearing loss), I collaborated with Claude across two contexts: Claude Sonnet 4.6 (claude.ai) for early concept exploration, project naming, and planning, and Claude Code, also running Claude Sonnet 4.6, for implementation across multiple sessions covering the correction formulas, test suite, and UI.

## What AI assisted with

- Explaining the underlying concepts (frequency, gain, Q/bandwidth, and how audiogram thresholds map to EQ correction) and helping think through the project's overall approach.
- Naming the project ("SoundLens").
- Drafting the project plan and specification (CLAUDE.md, `Audiogram_EQ_Project_Plan`) that defines the correction formulas, tier thresholds, and safety limits used throughout.
- Implementing the correction logic, test suite, and UI (knob rendering, color-coded warning states, preset handling) across several Claude Code sessions.

## What I reviewed and how

My review was concentrated on **code correctness, test integrity, and UI behavior** — not on validating the underlying hearing-correction math against real-world data. Specifically, I:

- Read generated code and tests directly (in-IDE and in the terminal) and caught issues Claude's own reasoning had missed — a TypeScript enum incompatibility flagged by IntelliJ, a `computeBands` signature using strings instead of the proper enum types, and a source-attribution error where a plan section was read from the wrong document.
- Identified structural problems in the test suite on my own reading — duplicated coverage between `interpolation.test.ts` and `extrapolation.test.ts`, an integration test that should have been a single functional pass rather than granular per-band assertions, and a spec ambiguity (`>` vs. `>=`) in the spread-warning boundary, which I resolved explicitly ("strictly greater than").
- Verified UI behavior by running the app and inspecting it visually — catching a knob-color mismatch (yellow rendering as orange), a disappearing warning icon on extrapolated bands, and a misaligned dropdown — then confirming proposed fixes before they were implemented.
- Confirmed an incomplete implementation phase by cross-checking the plan document directly, after suspecting we'd only partially completed it.

**What I did not do:** I did not compare computed EQ outputs against a real audiogram, listen-test the resulting sound, or manually verify the correction formulas against an external or clinical source. The core algorithm — boost percentages, tier thresholds, interpolation method — comes directly from the spec and was not independently re-derived or validated against hearing-science literature in these sessions.

## What I changed or directed

- Redesigned how capped corrections are represented and displayed: changed a proposed always-present `safeCorrection` field to a conditional `cappedCorrection` shown only when a correction exceeds safe range, and later corrected my own initial fix so that a knob is suppressed (not just recolored) when it falls outside an EQ's physical range — after realizing color alone couldn't account for EQs with different physical limits.
- Directed the use of proper enums (`Formula`, `DisplayMode`) in place of string/magic values, and scoped one test refactor (`toBeCloseTo` → `toBe`) to a single file rather than applying it project-wide.
- Directed a full restructuring of the integration test suite toward functional, full-output assertions.
- Made product decisions with no prior AI proposal: setting "headroom-safe" as the default mode, initializing the audiogram to a flat 0 dB baseline on startup, and articulating the underlying principle that knob color should follow the knob's position rather than a fixed rule.
- Added a `gridInterval` field to all four EQ presets directly via file edit.

## Accountability

I maintain full responsibility for SoundLens — its code, its behavior, and its output. AI assistance was substantial in drafting the plan, writing code, and building the UI, but every change was reviewed by me, and several design and correctness issues were caught and resolved through my own review rather than AI's.

One limitation is important to disclose plainly: **the hearing-correction values SoundLens produces have not been validated against real audiograms, clinical data, or listening tests.** They follow a documented formula-based approach, not a clinically verified one. SoundLens is a personal engineering project exploring how EQ correction *could* work from audiogram data — it is not a substitute for a fitted hearing aid or professional audiological care. Anyone using it for actual hearing compensation should treat its output as a starting point, not a prescription, and consult an audiologist for anything beyond casual experimentation.

This disclosure is made in the spirit of the transparency and accountability that the AI Fluency Framework's Diligence competency asks for — being clear about where AI was involved, what I verified myself, and what remains unverified.
