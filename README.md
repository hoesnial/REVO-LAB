# REVO — Jelajah Revolusi Industri

REVO is a fullscreen educational game about the Industrial Revolution. Explore a stylized steam-powered textile factory, assemble its main components, run a safe steam-engine experiment, and reflect on the historical impact.

This repository contains the REVO application only.

## Requirements

- Node.js 22.12 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The root route opens the REVO menu; the application routes live under `/revo-lab`.

## Build and test

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

For browser tests, start the production build on port 3001 in one terminal and run the suite in another:

```bash
npm run build
npm run start -- --port 3001
npm run test:e2e
```

Set `REVO_BASE_URL` to use a different running server. Playwright requires a supported browser; the configuration uses local Google Chrome when available and otherwise uses Playwright's browser installation.

## Learning flow

Menu → Era selection → learning objectives / Industry 1.0 briefing → five-part exploration → 3D assembly and knowledge checks → safe steam-engine observations (motion, output, and transmission) → historical reflection → learning summary.

Industry 2.0 supports briefing, seven-part exploration, five assembly connections and three concept checks, followed by a conveyor experiment with four recorded observations. Reflection and the learning summary are not available yet. Industry 3.0 and 4.0 remain locked.

Progress is stored locally in the browser. The simulator uses an educational model, not engineering-grade thermodynamics. See [docs/REVO-LAB.md](docs/REVO-LAB.md) for the full walkthrough, mechanics, accessibility notes, and known limitations.

## Academic review and presentation

The Indonesian [REVO-008 delivery package](docs/revo-delivery/01-project-overview.md) includes learning-outcome mapping, a content audit, draft validation instruments and pre/post tests, a demo script with labelled demonstration media, a lecturer presentation outline, and a release-readiness checklist. It does not contain teacher approval, student results, or evidence of learning effectiveness.

The [REVO-008R.1 revision audit](docs/REVO-008R1.md) documents the lecturer feedback, observation-based progression, V1→V2 save migration, verification results, and [before/after screenshots](docs/revo-008r1-media/README.md).

The [REVO-008R.1.1 UI/UX audit](docs/REVO-008R1-1.md) records semantic resource controls, accessible answer states, contrast measurements, test-count reconciliation, and [visual evidence](docs/revo-008r1-1-media/README.md).

The [REVO-009A Industry 2.0 readiness audit](docs/REVO-009A.md) records the I.1 architecture boundary, visual review, R.2 dependency decision, proposed 2.0 learning interactions, implementation backlog, and school-readiness gates.

The [REVO-009B.1 implementation report](docs/REVO-009B1.md) covers the Industry 2.0 briefing, interactive factory, independent save data, test results, and screenshots.

The [REVO-009B.2 report](docs/REVO-009B2.md) covers the Industry 2.0 assembly activity, concept checks, and save migration.

The [REVO-009B.2.1 cross-era audit](docs/REVO-009B2-1.md) describes shared navigation, independent resumes and resets, and the browser comparisons.

The [REVO-009B.3 experiment report](docs/REVO-009B3.md) explains the conveyor model, observation rules, save migration, and browser evidence.
