# Interview rapid-fire — locked (drill 5.d-int-rapidfire / #1840 drill 1.3)

**Drill:** 5.d-int-rapidfire · Six rounds · #1840 drill 1.3
**Locked:** 2026-05-19 by @climacon
**Mockups:**

- `5d-int-rapidfire/round-1-row-layout-comparisons.html`
- `5d-int-rapidfire/round-1b-hanging-q-mobile-comparisons.html`
- `5d-int-rapidfire/round-2-speaker-scope-comparisons.html`
- `5d-int-rapidfire/round-3-row-divider-comparisons.html`
- `5d-int-rapidfire/round-4-section-opener-comparisons.html`
- `5d-int-rapidfire/round-4b-label-word-comparisons.html`

---

> This lock supersedes the legacy Phase 2 `<QaGroupRapidFire>` (cream-redesign rewrite). The qaBlock `tag: rapid-fire` collapse rule from drill 1.2 (consecutive rapid-fire pairs → single group) stands unchanged — only the visual treatment changes.

## What this drill resolves

- ✅ Per-pair Q/A layout — **Round 1 D** (hanging-Q rail, mono caps Q on 132px left rail, body answer on the right).
- ✅ Mobile fallback — **Round 1b 1** (Q stacks above A below `~640px`).
- ✅ Speaker scope — **Round 2 A** (full speaker strip: kicker line + avatar + name + role).
- ✅ Row divider — **Round 3 A** (dotted ink-muted, matches standard `<QARow>` divider — Phase 3-b primitive).
- ✅ Section opener — **Round 4 D** (MonoLabel centered between two 1px ink hairlines).
- ✅ Label word — **Round 4b A** (`Kort & Krachtig`).

## What this drill does NOT decide

- **Multi-respondent rapid-fire** — explicitly out of scope. The qaBlock dispatcher already treats `rapid-fire` as single-respondent; a multi-respondent rapid-fire authored value falls back to repeating standard `<QARow>`s.
- **Editor-authored label override** — the `Kort & Krachtig` string is a renderer constant, not a schema field. A `QaSection`-level `label` override could be revisited if editorial need surfaces; out of scope for #1840.
- **Per-pair `tag` other than `rapid-fire`** — `standard` / `key` / `quote` are drilled separately (1.1, 1.2, 5.A.2 PullQuote lock).

## Locked component shape

```text
─────────────────  Kort & Krachtig  ─────────────────       ← centered MonoLabel between 1px ink hairlines

[●L] LARS JANSSENS · AANVALLER                              ← full speaker strip (32px avatar + mono tag)

FAVORIETE GOAL           De volley tegen Diest in de slot­minuut.   ← hanging-Q row: 132px mono caps rail · 22px gap · body
............................................................        ← Phase 3-b dotted ink-muted divider
SPELER OM TE VOLGEN      Wim. Hij maakt iedereen beter.
............................................................
BUS-MUZIEK               "Geen liedjes — koptelefoon op, ogen dicht."
............................................................
EERSTE KCVV-HERINNERING  Hand vasthouden van mijn pa, U7.
```

### Section opener — `RuledLabel` shape

- **Layout:** flex row · `gap: 14px` · 1px ink rule on each side · `flex: 1` rules · centered label.
- **Label typography:** `--font-mono` · 10px · `letter-spacing: 0.22em` · `text-transform: uppercase` · `font-weight: 600` · `color: --color-ink`.
- **Label value:** authored as `"Kort & Krachtig"` (title-case both words). MonoLabel CSS renders it `KORT & KRACHTIG`.
- **Spacing:** 22px margin-bottom between the ruled label and the speaker strip below.
- **Reuse:** same primitive family as the locked `<ArticleCredits>` 1px-ink-rules-top-and-bottom block. Worth extracting a shared `<RuledLabel>` (rules + centered MonoLabel) if a third consumer surfaces — single-consumer for now.

### Speaker strip

Same as the existing standard `<QARow>` `SpeakerHeader`:

- 32px `SubjectAvatar` (row scale, monogram, jersey-deep on cream).
- Mono caps tag: `<NAME>` (color `--color-ink`) `·` `<ROLE>` (color `--color-ink-muted`).
- `flex items-center gap-3`, 18px margin-bottom before the pair list.

### Pair rhythm (desktop ≥ 640px)

- **Grid:** `grid-template-columns: 132px minmax(0, 1fr)` · `gap: 22px` · `align-items: baseline`.
- **Q label:** mono caps · 10px · `letter-spacing: 0.16em` · `text-transform: uppercase` · `color: --color-ink-muted` · `line-height: 1.45`.
- **A answer:** Freight Display body · 16px · `line-height: 1.55` · `color: --color-ink`.
- **Row padding:** 14px top + bottom · 1px dotted `--color-ink-muted` `border-bottom` on every pair except the last.
- **Editorial guidance for Q labels:** keep to ≤ 3 words; renders best at 1–2 tokens. Long sentence-style questions belong on a standard QARow, not a rapid-fire pair. (Will be added to the Studio help text on the qaBlock `tag: rapid-fire` branch.)

### Pair rhythm (mobile < 640px)

- **Grid collapses** to a single column. Q label sits above A with 5px gap.
- Q typography unchanged (same 10px MonoLabel).
- A typography unchanged (same 16px Freight body).
- Row padding tightens to 12px top + bottom.
- Dotted `--color-ink-muted` `border-bottom` between pairs unchanged.

### Breakpoint

- Switch at **640px** (existing `md` Tailwind breakpoint in `apps/web`). No new breakpoint token.

## Component contract

The existing `<QaGroupRapidFire>` (currently in `apps/web/src/components/article/blocks/QaBlock/QaGroupRapidFire.tsx`) is rewritten to match this lock. The qaBlock dispatcher's behaviour (collapse consecutive `rapid-fire` pairs into one group, flatten to `respondents[0]`) is unchanged.

```tsx
<QaGroupRapidFire
  respondent={{ firstName, fullName, role }}    // single — collapsed by dispatcher
  pairs={[                                       // 1..N rapid-fire pairs
    { question: "Favoriete goal", answer: <PortableText … /> },
    …
  ]}
/>
```

- The component renders the ruled-label opener + speaker strip + the pair grid.
- The component does NOT render the `Kort & Krachtig` label as editor input — it's a constant inside the renderer.
- Storybook needs a state-coverage story per `feedback_state_coverage_stories.md`: short pairs · long pairs · 2 pairs · 8+ pairs · mobile viewport · empty answer.

## Net new vocabulary / schema

- **Schema:** none. Reuses existing qaBlock `tag: rapid-fire`, `respondents[]` (flattened to `[0]`), and `question`.
- **Design tokens:** none.
- **Component:** in-place rewrite of `<QaGroupRapidFire>` — no rename, no new file path.
- **Potential extraction:** `<RuledLabel>` (1px ink rules + centered MonoLabel) — defer until a third consumer surfaces.

## Downstream impact

- **#1829 (5.B body migration)** — this unblocks the `<ArticleBody>` consumer's `rapid-fire` branch. Body migration can ship the rewritten `<QaGroupRapidFire>` against this lock.
- **Storybook** — existing `QaGroupRapidFire.stories.tsx` needs full refresh against the locked vocabulary (cream surface, hanging Q, hairline opener, "Kort & Krachtig" label).
- **Studio help text** — add a one-liner on `qaBlock.tag` describing the rapid-fire editorial guidance (short Q labels ≤ 3 words).
- **`feedback_reuse_approved_primitives`** — opener reuses the `<ArticleCredits>` ink-hairline family; row divider reuses Phase 3-b dotted ink-muted; speaker strip reuses `<QARow>`'s `SpeakerHeader`.

## Source-of-truth

- Mockup HTML: paths listed above.
- Phase 5 article shell placement: between `<EndMark>` candidate and `<ArticleCredits>` — same as standard `<QARow>` body flow (no special placement rules).
- Memories consumed: `feedback_reuse_approved_primitives`, `feedback_monolabel_cream_full_opacity`, `feedback_no_magazine_chrome`, `feedback_drill_visual_then_ia`, `feedback_state_coverage_stories`.
- Existing interview locks that remain unchanged: `interview-locked.md` (QA row number style + ArticleCredits block).
