# Handoff — from the D-series design pass to build

Written 2026-08-14, at the close of the D1–D17 pass. **This document is self-sufficient**: a fresh
session can work from it without replaying the conversation that produced it.

- **Decisions:** [`decision-sheet.md` §8](./decision-sheet.md)
- **Evidence:** 23 HTML comparison pages in `docs/design/mockups/research-d-series/`
- **Outcome:** 43 items ruled on — **14 accepted, 23 rejected, 6 found already built**

---

## 1. The immediate next action

**Run `/to-spec`, then `/to-tickets`.** Both are Matt Pocock plugin skills at
`~/.claude-personal/plugins/cache/claude-plugins-official/mattpocock-skills/1.2.3/skills/engineering/`.

Three things to know before you do:

- **`/to-spec` is `disable-model-invocation: true`.** You type it; an agent cannot reach for it.
- **It synthesises the _current conversation_.** If you run it in a fresh session, point it at this
  file and at `decision-sheet.md` §8 first — otherwise it has nothing to synthesise.
- **Do NOT use KCVV's own `/spec`.** That one refines _open issues_ and cannot receive a closed
  decision set. This is the same trap documented for the #2425 wayfinder map.

**These skills are frequently missing from the session's skills list.** They are still installed —
check the plugin cache path above before concluding a step is unavailable. (This handoff's own author
made that mistake once, with a `find -maxdepth 4` that never reached the cache.)

---

## 2. Build units, in the order they should ship

Ten units. Dependencies are stated; everything else is parallel.

### Unit 1 — M9, the accessibility defect _(ship first)_

**69 of 113 `animate-pulse` uses are unguarded by `motion-safe:`.** This is not a design upgrade
wearing an idea's clothes — it is a reduced-motion defect that ships today on every skeleton and
`loading.tsx`. It was taken in D0 without a comparison for that reason.

Scope: named `image-loading` / `image-loaded` keyframes replacing `animate-pulse`, plus the 69 fixes.

### Unit 2 — The free tier (D0), no decisions left in it

- **C6** `::selection` — jersey-deep ground, cream text; inverted inside ink and jersey bands.
- **S8** transparent reserved borders — `1px solid transparent` wherever a hover adds a border.
- **M6** thickening underline on hover — `transition: text-decoration-thickness`.
- **Y4** figure sets applied consistently — scores and tables to mono or `lining-nums`, in-prose
  dates left oldstyle. Applying a documented rule, not deciding one.

### Unit 3 — Two documentation debts _(gates other units)_

- **C3 — write the rule-weight split into `DESIGN.md`.** Measured: `border-paper-edge` **90** uses
  vs `border-2 border-ink` **16**. The split already exists — hairlines separate rows and sections,
  2px ink draws objects that cast a shadow — it is simply undocumented, which is why it is invisible
  to a reviewer and one edit from drifting. No code change.
- **M1 — write the `DESIGN.md` Motion section** and reset Tailwind's `--animate-*` namespace the way
  `--text-*` was reset in #2417. **This gates Unit 9.** Tokens already exist
  (`--motion-fast/base/tape`); the gap is a rule saying which is used when.

### Unit 4 — Substrate

- **T3** — the page ground gets texture _for the first time_. The existing speckle token at 5% plus
  a broad low-frequency mottle (`baseFrequency 0.014`, 4 octaves) **in ink at 9% multiply**. Two
  custom properties and one rule on `body`. No asset, no request, no fallback.
  - **Note for review:** ink at 9% over cream is a desaturated darkening. Three cream-tone
    alternatives were rendered side by side and lost. See the boxed note in §8 before re-litigating.
- **T7** — the trimmed band edge (`D — guillotine + nicks`): ~3px nicks across a **600px tile**,
  `mask-repeat: repeat-x` so tooth size never scales with the viewport, plus **~24px of new bottom
  padding** or the edge eats the last line.
  - **Blocked on a design question, not a build one:** `StripedSeam` already says "this section is
    taped to the page". Resolve the purpose split first — proposed, not decided: seam for a section
    that continues, trim for a section that ends.

### Unit 5 — Colour

- **T6** — one new **non-semantic** tint token, manila `#f0e4c4`, plus a `SectionBg` option.
  **Index pages only, once per page.** Do not reuse `alert-soft` / `warning-soft` / `success-soft`:
  `globals.css` states they exist to give the three Alert variants their soft bodies.
  `cream-soft` keeps its job as the step-down; the tint is a _chapter_, not a step.
- **C5 / D6a** — age-band tones on **both** the group bar and the card kicker.
  - Build is a 4-entry map from `getYouthDivision()` (`src/lib/utils/group-teams.ts`) to an existing
    token. **Handle the `null` branch** — it returns null for senior codes _and_ for `U5`.
  - **Two open sub-questions for build time**, both recorded in §8: the tone set reuses
    `--color-alert` and `--color-warning`; and `jersey-deep` as the Bovenbouw tone means three of
    four bands lose the green kicker they have today while one keeps it — and that token is also
    `--color-jersey-link`.

### Unit 6 — Match day _(the largest single item)_

**Scope it as a checkpoint against `docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`, with a Storybook story per ground — not as an edit.**

- `MatchStrip` gains an `isToday` concept it does not have today (no `isToday`, no "Vandaag",
  anywhere in it, `dates.ts` or `match-display.ts`). **Compute in Europe/Brussels** — PSD dates are
  Belgian wall-clock and a naive UTC comparison flips the label at the wrong hour.
- On that day the fixture row reads `Vandaag · 15:00 · De Dries` and the strip takes
  `--color-jersey-deep-dark` (#133d28).
- **It is a dark-ground variant of _both_ layouts**, roughly a dozen class swaps behind one boolean:
  CTA `primary → inverted`, arrows and dividers to cream alphas, team names and score to cream,
  slide label to a cream alpha, meta line to `warm`.
- Day-granular, so the homepage's `revalidate = 900` is harmless — worst case the label appears
  fifteen minutes after midnight.

### Unit 7 — `/inhoud`, the contents page

- Teams (26), articles (125), events (80), club pages (9). **No players** — A7 rejected a player
  index and 0 of 294 carry a slug.
- **Every entry derived from Sanity or the BFF, never authored.** `llms.txt` already drifted this
  way once, shipping `/club/organigram` after the route was removed.
- Ships with **S5 leader dots** (the `flex` + dotted-border filler, `aria-hidden` on the filler).
- **Two obligations:** update `apps/web/public/llms.txt` in the same PR, and add a footer link.
  It must not become navigation — the nav is flat and stays flat (#2409/#2415).

### Unit 8 — Type and section openers

- **S2** — `SectionHeader` gains a `rule` variant. **Never on `EditorialHeading`** (breaks nine
  heroes, #2552). Centring the heading is the real change, so the variant wants a length rule or a
  single-line constraint.
- **Y1** — a `line-height: 0.85` sibling step, **two-line heroes only**. Needs `padding-block` or
  ascenders clip.
- **Y8** — `-0.025em → -0.035em` at the **two largest steps only**.
- **Y6** — hanging punctuation on pull quotes. `hanging-punctuation` is Safari-only and the fallback
  is a negative `text-indent`; **the two must be mutually exclusive** or the quote hangs twice.
- **Y3** — oversized ghost numerals. **BLOCKED — see §3.**

> **Y1 and Y8 go in `@theme` as ramp steps.** Never hand-applied `leading-*` / `tracking-*` — that
> drift is what #2417 repaired.

### Unit 9 — Motion _(blocked on M1, Unit 3)_

- **M4** — squeegee wipe (`clip-path: inset()`) on section entry. **Must degrade to "already
  visible"** — a section that never animates must never stay hidden.
  **Retired 2026-09-21 (#2623)** — built, then deleted. Read the decision sheet's M4 note before
  proposing it again.
- **M7** — background-fill hover for **list rows only**. **Must be documented as scoped** or it
  erodes the canonical press-down everywhere else.

### Unit 10 — Photo and small delights

- **D9 / T2** — `data-print="overprint"` on `TapedFigure`: `mix-blend-mode: lighten` against a
  `--color-jersey-deep-dark` plate. Opt-in per figure (`data-tint="none"` is the precedent), and
  watch the per-figure compositing layer on card grids.
- **D4** — `[×]` and `[?]` in mono **beside** the Phosphor icons, never instead of them or of an
  accessible name.
- **D7** — shirt numerals in the display register, **match lineups only**.
  `MatchLineupPlayer.number` is in the contract; player profiles have 0 of 294 populated.

---

## 3. Gates — sequence these, do not build them first

| Gate                          | Blocks      | Why                                                                                                                                                                                                                        |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#2598** homepage overflow   | **Y3** only | Ghost numerals depend on `overflow: hidden` clipping rather than overflowing — the exact unresolved defect. Y2 and S1 were the other two exposed moves and both are now rejected, so the blast radius is down to one item. |
| **M1** Motion section         | **M4, M7**  | Two gestures are not a vocabulary until the rule exists.                                                                                                                                                                   |
| **`matchstrip-locked.md`**    | **Unit 6**  | Locked component; needs a checkpoint, not an edit.                                                                                                                                                                         |
| **StripedSeam purpose split** | **T7**      | Two devices answering the same question on the same surface.                                                                                                                                                               |

**#2599 (two-line match row) is no longer a gate.** Everything that would have landed on that row
closed on its own merits: M2 and M10 (no data for "in progress"), M3, S3 (already built), C1
(cancelled is already `card-red`).

---

## 4. The rule to carry into review

**Before accepting any "new chrome" proposal from this research corpus, grep for what already renders
in that position.** Six of the corpus's proposals were already shipped:

| Proposal             | Already there                                                                |
| -------------------- | ---------------------------------------------------------------------------- |
| §5B wire strip       | `MatchStripSlot` — a band under the nav, locked spec                         |
| S1 spec table        | `MatchHero` takes the exact field set; `MatchEventsSection` owns goals/cards |
| D1 print-nav footer  | `VerderLezenRow` + `EndMark`                                                 |
| S3 corner ribbon     | `MatchStatusBadge`, rotated 2°, on `MatchHero`                               |
| C3 two rule weights  | 1px hairlines already beat 2px borders **90 : 16**                           |
| M5 wipe-in underline | `EditorialLink`'s masked `STROKE_PATH` sweep — M5 would be a **downgrade**   |

Three more rested on premises the code contradicts: §4.3's _"our border is 2px everywhere"_, T2's
`multiply` (does the opposite of its stated intent — its own cited source has the right operator),
and §5B's `● LIVE` (no in-progress state exists in `MatchStatus`, and `PRODUCT.md:56` forbids live
scores).

**The research could read the live site but not the codebase.** That is the whole pattern.

---

## 5. Open threads, deliberately not closed

- **`clubs-international-deep-dive.md` Part G** — eight further ideas, never triaged. The only
  remaining untriaged design material in the corpus.
- **The agate fact-block has no surface.** Approved as a treatment (mono-caps label, 2px rules top
  and bottom, tabulated key/value at the 10px floor, absent values as `—`) but its three proposed
  homes were all occupied. Run the §4 check before placing it.
- **A club-wide cancellation band** — "alle wedstrijden van dit weekend gaan niet door". Surfaced
  while rejecting the fluoro accent. It needs no new colour, it is what a parent opens the site for
  on a wet Saturday, and a per-match badge cannot say it. Not filed.
- **D6a's two token questions** — see Unit 5.

---

## 6. What is explicitly _not_ next

The 23 rejections are recorded with reasons in §8 so they are not re-proposed. The ones most likely
to come back, and the one-line answer to each:

- **Two-ink misregistration (§5A / T1 / T4)** — rejected outright, not deferred.
- **A fluoro accent (C1)** — its three use cases are occupied, forbidden, or the same colour twice.
- **A warm ink (C4)** — the only change in the series that cannot be VR-captured locally.
- **`/index` as a path** — Dutch route, `/inhoud`. `index` is a server default-document name.
- **The match-day marquee (M3)** — the hero is a scoreboard, and `MatchStrip` already occupies the slot.
