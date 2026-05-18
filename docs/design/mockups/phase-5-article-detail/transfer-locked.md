# Transfer variant body — locked (drill 5.d-tra)

**Drill:** 5.d-tra · Round 1 · #1789
**Locked:** 2026-05-18 by @climacon
**Mockups:** `5d-tra/round-1-transfer-body-comparisons.html`

---

## Scope reminder

This drill is **body-only**. The transfer hero is locked at Phase 3-b R1.5 (#1749) — see `docs/design/mockups/phase-3-b-editorial-hero/transfer-locked.md`. The hero already consumes every `transferFact` field (direction, playerName, position, age, otherClubName + Logo + Context, kcvvContext, until, note, noteAttribution).

## Decision — Body treatment for additional `transferFact` blocks

**Option D — TapedCardGrid (compact taped cards) with adjacency-aware layout.** When `body[]` contains more than one `transferFact` block, the first powers the hero per the existing R1.5 lock; every subsequent transferFact renders as a compact `<TapedCard>` in the body at the editor's chosen position.

**Layout rule (interleaving):**

- **Single isolated transferFact** (no other transferFact block immediately adjacent in `body[]`) → renders as a 1-up `<TapedCard>` at full prose width (`--container-prose: 680px`).
- **Consecutive transferFacts** (two or more adjacent in `body[]` with no intervening block) → renderer auto-flows them into a **2-up grid** at prose width. Trailing odd card renders 1-up below the grid.

Example:

```text
body[0]  text          "Niels Geukens (23)…"             ← dropcap paragraph
body[1]  transferFact  Niels                              ← FIRST → powers hero (not in body)
body[2]  text          "Met de jeugd erbij…"
body[3]  H2            "Ander transfernieuws"             ← editor-authored heading
body[4]  transferFact  Joren        ┐
body[5]  transferFact  Daan         ┘ adjacent → 2-up grid
body[6]  text          "De voorbereiding start op…"
body[7]  transferFact  Bram                                ← isolated → 1-up card
body[8]  text          "Tot snel."
```

Editor controls placement and grouping. The renderer's only adjacency-aware behavior is "consecutive transferFacts → 2-up grid".

## Why D + adjacency rule

- **Honors the schema's promise** that "every subsequent transferFact renders as a compact overview row" without enforcing extraction-and-grouping. PortableText semantics stay clean.
- **Editor controls density** — group transferFacts adjacent for the grid look, or intersperse with prose to give each transfer its own narrative paragraph.
- **No new schema** — uses existing transferFact fields (direction, playerName, position, age, otherClubName, otherClubLogo, otherClubContext, kcvvContext, until).
- **Reuses Phase 0/4 vocabulary** — `<TapedCard>` + `<TapeStrip>` + slot-deterministic rotation + ink border + offset shadow. Same primitives as `<NewsCard>` / `<PlayerFigure>`.

## TapedCard composition (locked)

Each compact card composes:

- **Outer:** `<TapedCard rotation>` (rotation seeded from `transferFact.playerName` hash, like `<NewsCard>` does)
- **Tape:** single `<TapeStrip>` top — `color="jersey"` for incoming/extension, `color="warm"` for outgoing (so the card surface carries the direction cue even before the chip is read).
- **Direction chip** (top-left): mono caps pill — `IN ↓` / `OUT ↑` / `VERLENGING ↻`. Same vocabulary as the hero's dir-chip.
- **Player name:** italic Freight Display 900, 16px.
- **Context line:** mono caps, 9px, ink-muted — concatenates `position` + `·` + `age + " jaar"` when both present.
- **From → to line:** italic serif, 13px — direction-dependent:
  - `incoming`: `otherClubName → KCVV · #{jersey}`
  - `outgoing`: `KCVV · #{old jersey} → otherClubName`
  - `extension`: `A-kern · #{jersey} · tot {until}`

Card is non-interactive (no link wrapper) — the transferFact block is content, not a navigation target.

## What this drill resolves

- ✅ Multi-transferFact body rendering (Option D — TapedCardGrid).
- ✅ Adjacency rule (consecutive → 2-up grid, isolated → 1-up).
- ✅ No new schema fields, no fabricated data.

## What this drill does NOT decide

- **Hero composition** — locked at Phase 3-b R1.5 (3-card `<TransferFactStrip>` with otherClubLogo + ★ player ★ + KCVV crest). Unchanged.
- **Single-transferFact transfer articles** — body has no transferFact-specific block (additional-transferFact rule doesn't trigger). Body is plain prose under the dropcap paragraph.
- **`playerRef` on transferFact** — flagged separately. See PRD §11 discovered unknowns.
- **Career history / fee / contract length** — not in current schema. Would be follow-up if editorial workflow demands.

## Discovered unknown: `playerRef` on transferFact

Spun out as a follow-up note (not a drill blocker): `transferFact` carries `playerName` as a denormalized string, with no `playerRef` link to the `player` document collection. This means:

- The hero's player photo comes only from `article.coverImage` (manual upload per article).
- The PSD-synced `player.psdImage` is never used for transfer hero photos.
- Even when the incoming player exists in our `player` collection, there's no auto-link.

Other variants that involve players (interview via `subject.playerRef`) DO have linked references. Bringing transfers in line would either:

1. Add `playerRef` to `transferFact` (block-level reference).
2. Open `subjects[]` to transfer articles (currently `hidden: articleType !== "interview"`) and use the existing `<SubjectsStrip>` pattern.

Either is out of Phase 5 scope per the issue's own scope note. Recorded as a follow-up in PRD §11.

## Net new primitives / schema

- **Schema:** none (uses existing transferFact fields).
- **Component:** `<TransferFactCard>` (or compose from `<TapedCard>` directly at the renderer level) — extends the PortableText custom-block renderer for `transferFact` type. Adjacency detection is a renderer concern, not a new primitive.

## Downstream

- **#1797 (5.B.tra)** — consumes this lock when implementing the body PortableText renderer for transfer articles. Title currently "transfer-variant body touches"; locked AC: render additional transferFacts per Option D + adjacency rule.
- **`<EditorialByline>`** — inherits the 5.d-col monogram chip when `article.author` is populated. Same byline behavior across all variants.

## Source-of-truth

- Mockup HTML: `docs/design/mockups/phase-5-article-detail/5d-tra/round-1-transfer-body-comparisons.html`
- Phase 3-b transfer hero lock: `docs/design/mockups/phase-3-b-editorial-hero/transfer-locked.md`
- Phase 4.5 R10 NewsCard structure (referenced for the TapedCard vocabulary): `docs/design/mockups/phase-4-homepage/newsgrid-locked.md`
- Memories consumed: `feedback_design_data_audit`, `feedback_reuse_approved_primitives`, `feedback_no_bright_jersey`.
