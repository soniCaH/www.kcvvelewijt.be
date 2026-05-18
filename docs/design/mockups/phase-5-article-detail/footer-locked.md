# Article footer layout — locked

**Drill:** 5.d4 · #1786
**Locked:** 2026-05-18 by @climacon
**Outcome:** **No drill round needed.** Drill closes by inheritance.

---

## Decision

The article-detail footer is a single `<VerderLezenRow>` (3-up
`<NewsCard>` row) at `--container-page` width on cream, with the
sparse-state behaviour locked by Phase 4.5 R10 ("cards drop, never
pad"). **No `<EditieLabel>` component, no magazine-edition line.**

## Why the drill was killed

The drill issue originally asked four questions (A stacked / B split
bands / C full-bleed + chip / D sidebar) — all four were ABOUT where
the `<EditieLabel>` line sits relative to the Verder-lezen row.
Without `<EditieLabel>`, the four options collapse into one:
a 3-up `<NewsCard>` row at page width.

### EditieLabel retirement

`<EditieLabel>` was the "Editie 47 · Lente 2026 · KCVV Elewijt
Magazine" line carried over from the retro-terrace-fanzine visual
baseline. The Sanity content audit revealed:

1. KCVV is a club website, not a magazine. We don't publish in
   numbered editions and don't run a separately-branded "KCVV Elewijt
   Magazine" product.
2. The data doesn't exist. `article` schema has no `edition` field; no
   editorial workflow produces edition numbers. The "47" was a
   placeholder, "Lente 2026" was a derivation from `publishedAt`, and
   the trailing "Magazine" string was invented chrome.
3. Per `feedback_design_data_audit`: mockups must render only fields
   PSD/Sanity actually provide; never fabricate. Per
   `feedback_no_newsletter`: KCVV doesn't run separately-branded
   publication surfaces and won't.

The same principle applies as the no-newsletter rule:
**don't fabricate publication surfaces we don't run.**

## Verder-lezen composition (inherited)

`<VerderLezenRow>` — 3-up `<NewsCard>` row at `--container-page` width.

**Structure** (inherited from Phase 4.5 R10):

- Outer `<TapedCard>` per card, flush-edge (image top edge-to-edge,
  1px ink rule, meta panel below).
- Image at `aspect="landscape-16-9"`.
- Two corner `<TapeStrip>`s per card, slot-deterministic rotation
  pair (`[left, right]` derived from the title hash; default colours
  `[warm, jersey]`).

**Per-`articleType` background** (inherited from Phase 4.5 R3):

- `transfer` → `bg="jersey-deep"` / cream text (full opacity per
  `feedback_monolabel_cream_full_opacity`).
- `interview` / `announcement` / `event` / null-legacy →
  `bg="cream"` / ink text.

**Sparse states** (inherited from Phase 4.5 R10):

- 0 related: row does not render.
- 1 or 2 related: cards drop; no padding to maintain 3-up.
- 3 related: standard 3-up.

**Heading** (Phase 5 convention, identical to homepage Uitgelicht):

- `<EditorialHeading size="display-md" italic>` with an accent
  decorator on the "Verder" substring: `<span class="accent">Verder
</span> lezen.`

**Container width:** `--container-page` (1120px). Mobile collapses
3-up → 1col.

No `<EditieLabel>`, no jersey-deep band, no full-bleed surface, no
asymmetric sidebar variant.

## What this drill resolves

- ✅ "What's the article footer composition?" — `<VerderLezenRow>`
  inheriting Phase 4.5 R10 + R3, full stop.
- ✅ "Where does `<EditieLabel>` sit?" — `<EditieLabel>` does not
  exist. Retired.

## Downstream issue impact

- **#1794 (5.A.3 EditieLabel + final footer composition)** — should
  close as no-op. The "final footer composition" work collapses
  entirely into #1793 (5.A.2 VerderLezenRow). Comment +
  close.
- **#1793 (5.A.2)** — unchanged scope. Already covers
  `<VerderLezenRow>`.
- **#1800 (5.C page.tsx rewire)** — body mentions `<EditieLabel>` in
  the rewire description; remove that mention.
- **#1527 (parent epic)** — body mentions Editie in scope summary;
  remove.

## PRD + brief impact

- `docs/prd/redesign-phase-5-article-detail.md` — §1 shared body shell
  loses `<EditieLabel />`; §1 closing note loses "Editie line is
  UI-only"; §3 phasing loses 5.A.3 Editie mention; §6 new-components
  table loses EditieLabel row; §9 row 5.d4 updated to lock; §8 issue
  table updates 5.d4 / 5.A.3 entries; §10 pre-resolved bullet for
  Editie 47 removed (or kept as historical note).
- `docs/design/phase-5-article-detail-brief.md` — §5 Editie section
  retired with reason; §10 Q3 row retired.

## Net new primitives

None. `<VerderLezenRow>` composes from existing primitives
(`<NewsCard>`, `<EditorialHeading>`, `<TapedCard>`, `<TapeStrip>`).
`<EditieLabel>` is retired before it ever shipped.

## Source-of-truth

- This file is the canonical lock.
- Phase 4.5 R10 — `docs/design/mockups/phase-4-homepage/newsgrid-locked.md`
- Phase 4.5 R3 — `docs/design/mockups/phase-4-homepage/card-semantics-locked.md`
- Memories consumed: `feedback_design_data_audit`, `feedback_no_newsletter`,
  `feedback_reuse_approved_primitives`, `feedback_monolabel_cream_full_opacity`.
