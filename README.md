# SoundLens

Turn your audiogram into equalizer settings — no new equipment required.

## What it does

SoundLens takes the hearing thresholds from your audiogram and converts them into suggested equalizer adjustments for the TV, computer, or car audio you already own. Everything runs in your browser; no data is ever sent anywhere.

It is not a clinical tool. The suggestions are starting points — trust your ears and keep adjusting from there.

## Live demo

[https://mpqc74.github.io/SoundLens/](https://mpqc74.github.io/SoundLens/)

## How to use it

1. Enter your audiogram thresholds (left and right ear, per frequency)
2. Choose the EQ preset that matches your device (TV, computer, Tesla, etc.)
3. Pick a calculation formula (Ideal, Half-gain, or Loss-adjusted)
4. Read the suggested dB value for each band and dial them into your equalizer

You can switch between **Boost mode** (all corrections are positive relative to your best-hearing frequency) and **Headroom-safe mode** (all corrections are zero or negative) depending on your device's volume headroom.

Bands outside your tested frequency range are extrapolated and shown as estimates.

## Privacy

All computation happens in your browser. Your audiogram data is never sent to any server.

## Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Run tests

```bash
npm test              # unit + integration tests
npm run test:e2e      # browser-driven acceptance tests
npm run test:coverage # coverage report
```

### Build

```bash
npm run build
```

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgements

Built as a capstone project for the [AI Fluency Framework Foundations](https://anthropic.skilljar.com/ai-fluency-framework-foundations) course by Anthropic.
