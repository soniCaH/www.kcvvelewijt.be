# Website research corpus — start here

Produced 2026-08-13 from a multi-agent research sweep over 130+ club websites and 28 non-football
design references. **This file is the front door.** A new session should not read the whole corpus —
it is ~7,900 lines.

> **This directory holds two corpora.** Everything down to *The finding that reframes everything*
> is the **website / design** corpus (2026-08). The **test-suite** corpus (2026-09) has its own index at
> the bottom of this file.

## Reading order

0. **[`handoff.md`](./handoff.md)** — if you are here to _build_, start and stop here. Ten build
   units in order, the gates between them, and the `/to-spec → /to-tickets` route. Self-sufficient.
1. **[`decision-sheet.md`](./decision-sheet.md)** — read this and nothing else to start.
   It carries every club decision with its answer, the remaining fact-gathering, the technical
   investigation results, and links to the GitHub issues. Everything below it is evidence.
2. Open an individual research file **only** when a specific claim needs its source. Each one cites
   URLs inline and states plainly what it could not read.

## Current state

|                                  |                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| Club decisions (C1–C17)          | **all 17 answered**                                                                               |
| Facts to gather (F1–F21)         | 20 open, filed as issues [#2592–#2597](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2592) |
| Technical investigations (T1–T8) | 6 of 8 done — results in `decision-sheet.md` §4                                                   |
| Web/design decisions (A1–A22)    | answered in `decision-sheet.md` §3                                                                |
| **Design upgrades (D1–D17)**     | **all answered — `decision-sheet.md` §8**                                                         |

Filed and tracked:

- [#2591](https://github.com/soniCaH/www.kcvvelewijt.be/pull/2591) — tag-casing migration (merged work, applied to both datasets)
- [#2592–#2597](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2592) — fact-gathering, grouped by who you ask
- [#2598](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2598) — homepage horizontal overflow, full root-cause diagnosis, **not fixed**
- [#2599](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2599) — A17 two-line match row, needs a prototype comparison

## The gap that was closed — 2026-08-14

**`retro-fanzine-design-inspiration.md` never fed the decision sheet.** The sheet was built by
consolidating every `## Open questions for Kevin` section; that file has none, because the design
agent delivered _proposals_ rather than questions. The consolidation found no marker and silently
skipped 706 lines — the same failure shape as a GROQ count against a misspelled field returning zero.

**§1, §4 and §5 have now been drilled** — HTML comparison pages, one question at a time — and
recorded as **D1–D17 in `decision-sheet.md` §8**. Twenty-three accepted, twenty-three rejected, four
found already built. The comparison pages live in `docs/design/mockups/research-d-series/`.

Still untriaged: `clubs-international-deep-dive.md` **Part G** (eight further ideas). §6's sixteen
explicit rejections need no triage — each already names the locked rule it breaks.

**The finding to carry into the spec:** six proposals were already shipped, and one shipped _better_
than proposed. Three more rested on premises the code contradicts. Before accepting any "new chrome"
idea from this corpus, **grep for what already renders in that position** — the research could read
the site but not the codebase.

## The files

**Club research** — what other clubs do, and what we should take from it:

| File                               | Lines | Covers                                                    |
| ---------------------------------- | ----- | --------------------------------------------------------- |
| `belgian-club-websites.md`         | 1000  | Synthesis, our own gap inventory, go-live questions       |
| `clubs-provincial-regional.md`     | 841   | 24 clubs incl. the Zemst neighbourhood; the village voice |
| `clubs-national-amateur.md`        | 719   | Our own tier, Dutch- and French-speaking sides            |
| `clubs-international-benchmark.md` | 747   | Non-Belgian clubs punching above their weight             |
| `clubs-international-deep-dive.md` | 919   | 31 clubs: JP, IS, FO, DE, ES, US, IE                      |
| `clubs-professional.md`            | 393   | 18 Belgian pro clubs                                      |

**Platform research** — what the competition gets for free:

| File                                 | Lines | Covers                                                       |
| ------------------------------------ | ----- | ------------------------------------------------------------ |
| `belgian-club-platforms-as-built.md` | 347   | Federation baseline, Twizzit, PSD, VoetbalAssist, Kicksite   |
| `platform-vendors-and-templates.md`  | 320   | Wix / Squarespace / WordPress+SportsPress, with real pricing |

**Design and UX:**

| File                                  | Lines | Covers                                                         |
| ------------------------------------- | ----- | -------------------------------------------------------------- |
| `retro-fanzine-design-inspiration.md` | 706   | 28 non-football references, CSS mechanisms read off live sites |
| `design-scorecard-football-sites.md`  | 652   | Merged rubric, us scored against it, measured not opined       |
| `mobbin-interaction-patterns.md`      | 628   | Mobbin glossary + FotMob / Sofascore / OneFootball             |

## Reliability notes

Written down because they cost real corrections during the sweep:

- **A GROQ count against a misspelled type or field returns `0`, not an error.** Three false findings
  came from this. Always pair a count with a nonzero control in the same query.
- **`matchPreview` / `matchRecap` are `articleType` values on `article`, not document types.**
- **The event date field is `dateStart`, not `startDate`.**
- **Stale numbers read exactly like live ones.** Three further errors came from trusting 6-day-old
  figures in `.impeccable/critique/` and `docs/design/*-wayfinder-map.md`. Re-measure before citing.
- **`www.kcvvelewijt.be` still serves Gatsby.** Measure against the Next.js prod host; the apex 404s
  every Next route.
- **LCP is only exposed via `PerformanceObserver` with `buffered: true`**, never
  `getEntriesByType`. Measured values are in `design-scorecard-football-sites.md`.

## The finding that reframes everything

Five capabilities are built and shipped but hold no content: match-bound articles (0 of 125 carry a
`matchId`), training schedules (0 of 26 teams), sponsor descriptions (0 of 33), player pages (0
slugs), jersey numbers (0). Three more club practices exist only in a PSD letter or a paper brochure.

**The gap between this site and the research recommendations is mostly content and authoring habits,
not code** — and with one author (C15), that argues for evergreen pages and system-generated content
over anything with a publishing cadence. Any spec should reflect that ordering.

## Test-suite corpus — 2026-09

Produced by [Test suite walk — findings map](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078), a `/wayfinder` map whose 22 tickets are all
closed. **The map is the front door for this corpus**, not this file: it carries every ruling as a
one-line gist with a link to the ticket holding the detail, plus the handoff contract for the spec
session. Read it first; open a document here only when a ruling needs its source.

| Document | What it establishes |
| --- | --- |
| [`test-suite-inventory.md`](./test-suite-inventory.md) | The 2026-09-22 baseline: counts, runtimes, skips, retries, where each check runs |
| [`test-suite-flake-ledger.md`](./test-suite-flake-ledger.md) | Every known flake, its layer, root-cause class and status |
| [`test-layer-balance.md`](./test-layer-balance.md) | What belongs in unit, component, contract, VR and E2E |
| [`e2e-determinism.md`](./e2e-determinism.md) | Keep Playwright; move E2E onto deterministic data |
| [`vr-tooling-and-determinism.md`](./vr-tooling-and-determinism.md) | Keep `@storybook/test-runner` and the amd64 pin; tune in place |
| [`vitest-runner-and-environment.md`](./vitest-runner-and-environment.md) | Keep Vitest and happy-dom; two of four "gaps" are Vitest's own shim |
| [`ci-for-a-turborepo-monorepo.md`](./ci-for-a-turborepo-monorepo.md) | Keep Actions and the one-job shape; four ordered changes |
| [`testmode-spike.md`](./testmode-spike.md) | What `next/experimental/testmode` does and does not reach |
| [`vr-diff-story-map.md`](./vr-diff-story-map.md) | A diff→stories map is possible, and the verdict is still *keep the full run* |
| [`agent-layer-suite-command-sweep.md`](./agent-layer-suite-command-sweep.md) | 35 agent-facing suite commands: 7 wrong, 12 bypassing, 1 stale |

**One of these is alive; nine are frozen.** `test-suite-flake-ledger.md` is the **register of the unit
of work** — a flake class is the unit, never an occurrence — and it is edited as classes open and
close. The other nine are dated evidence: cite them, do not revise them.
