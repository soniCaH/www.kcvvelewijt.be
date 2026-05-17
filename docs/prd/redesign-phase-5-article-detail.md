# PRD — Phase 5 · Article Detail Redesign

**Status:** comprehensive — all 6 article variants scoped in one PRD; design decisions handled via a single drill-down tree (one question per round, A/B/C/D options) per `feedback_design_drill_pattern`. No per-variant PRD update phase.
**Authored:** 2026-05-17.
**Owner:** @climacon.
**Predecessor:** Phase 4.5 homepage refinement (#1745, all R1–R10 locks merged).
**Tracker:** #1527.
**Brief / design input:** `docs/design/phase-5-article-detail-brief.md` (consolidated brief — system inheritance + owner refinement prompts + open drill questions).
**Master plan:** `docs/plans/2026-04-27-redesign-master-design.md` §5.2 (duo interview) + §6.2 (non-interview variants).
**Superseded:** the legacy `docs/prd/article-detail-redesign.md` + `article-detail-redesign` milestone close when this work merges.

---

## 1. Scope

Rebuild `apps/web/src/app/(main)/nieuws/[slug]/page.tsx` for all `article.articleType` values with the retro-terrace-fanzine vocabulary established in Phase 4.5.

### Key insight: variant-specific work is small

All six variants share the **same body shell**:

```text
<EditorialHero placement="detail" variant={articleType} />   <-- already locked R1.5 (#1749)
<DropCapParagraph>                                            <-- Phase 1 primitive
<PortableText body />                                         <-- existing renderer + accent decorator
<PullQuote interspersed />                                    <-- Phase 1 primitive
<EndMark flourish="star" />                                   <-- Phase 1 primitive
<VerderLezenRow />                                            <-- net-new (3-up NewsCard row, R3 backgrounds)
<EditieLabel />                                               <-- net-new (UI-only, derived from publishedAt)
```

Each variant overlays variant-specific touches inside this shell — drilled below in §9.

### Per-variant header status

| `articleType`   | Header status                                                       | Variant-specific body work              |
| --------------- | ------------------------------------------------------------------- | --------------------------------------- |
| `interview`     | `<EditorialHero variant="interview" placement="detail">` (#1749)    | `<QASection>` + `<InterviewCredits>`    |
| `announcement`  | `<EditorialHero variant="announcement" placement="detail">` (#1749) | column-style body (drill 5.d-col)       |
| `transfer`      | `<EditorialHero variant="transfer" placement="detail">` (#1749)     | transfer body treatment (drill 5.d-tra) |
| `event`         | `<EditorialHero variant="event" placement="detail">` (#1749)        | event detail block (drill 5.d-evt)      |
| `matchPreview`  | EditorialHero variant pending #1470                                 | match details (drill 5.d-mat)           |
| `matchRecap`    | EditorialHero variant pending #1470                                 | match details (drill 5.d-mat)           |
| `null` (legacy) | Falls back to `announcement` variant                                | shared shell only                       |

Two variant categories worth calling out:

- **`announcement`** doubles as the editorial "column" variant per `feedback_design_drill_pattern` — the master plan listed `column` as a distinct articleType but Sanity merged it under `announcement`. Drill 5.d-col covers both.
- **Matchverslag** is `matchRecap`; **matchvoorbeschouwing** is `matchPreview`. Both are gated on #1470; once that ships their EditorialHero detail variants land too. Drill 5.d-mat picks up both with the same body treatment.

**Sanity migrations required:** 0 expected. `articleType`, `subjects[]`, body PT blocks, `firstTransferFact`, `firstEventFact` all already on schema. Editie line is UI-only.

---

## 2. System inheritance — non-negotiable

All Phase 4.5 + earlier locks apply. **Do not re-derive in any Phase 5 drill round.** Quote the brief §1 instead.

### Phase 4.5 R9 — Photo treatment

`--filter-photo-newsprint` + `--pattern-paper-grain` + `--shadow-photo-tape` apply to every `<TapedFigure>`. `data-tint="none"` is the per-instance opt-out for designed graphics. Layered "lift" hover Variant A is RETIRED (#1748).

### Phase 4.5 R10 — Card structure

`<NewsCard>` flush-edge structure consumed by `<VerderLezenRow>`. Outer `<TapedCard>` is the only frame; no nested `<TapedFigure>` inside `<NewsCard>`.

### Phase 4.5 R3 — Per-`articleType` card backgrounds

`<NewsCard bg>` lookup: `transfer` → `jersey-deep` / cream text; `interview` / `announcement` / `event` → `cream` / ink text. Consumed by `<VerderLezenRow>`.

### Phase 0–4 primitives (master plan §4)

`<TapedCard>` + `<TapedFigure>` + `<EditorialHeading>` (accent decorator) + `<MonoLabel>` (full-opacity cream per `feedback_monolabel_cream_full_opacity`) + `<DropCapParagraph>` + `<PullQuote>` + `<EndMark>` + `<StripedSeam>` (no `<SectionTransition type="diagonal">` — see #1701 migration).

### Body width

`--container-prose: 680px` for any long-form article body.

### Inline emphasis in body copy

Portable Text custom decorator only (`feedback_inline_emphasis_via_portable_text`). Never a flat string + separate accent-substring field.

### Hover model

Canonical press-down everywhere. `<EditorialHero placement="detail">` is non-interactive (no link wrapper).

### Multi-line `<HighlighterStroke>` (#1543)

Phase 1 shipped single-line only; multi-line wrapping is needed once body emphasis lands inside long-form copy. The technical approach (server vs client, resize behaviour, per-line stroke variant) **locks inside this PRD during 5.A.1** — see §10 Q3.

---

## 3. Phasing

```text
5.0    Tracer — `/nieuws/[slug]` route audit + ARTICLE_BY_SLUG_QUERY projection audit
        verify subjects[], firstTransferFact, firstEventFact, body PT blocks ship for all variants;
        confirm <EditorialHero placement="detail"> renders correctly for each variant against real Sanity data

5.d.*  Design drill rounds — one decision per round, A/B/C/D options
        Sequence: 5.d1 → 5.d2 → 5.d3 → 5.d4 → 5.d-int → 5.d-col → 5.d-tra → 5.d-evt → 5.d-mat
        Each drill is its own ready-for-Ralph sub-issue; the user runs them as one /design-an-interface
        loop until each closes with an owner-approved mockup committed under
        docs/design/mockups/phase-5-article-detail/<round>/. Round outputs feed §9 lock tables here.

5.A    Body composition build — shared shell across all variants
        ├─ 5.A.1   Body container + <DropCapParagraph> + Portable Text body + multi-line <HighlighterStroke>
        ├─ 5.A.2   <PullQuote> placement + <EndMark> + <VerderLezenRow>
        └─ 5.A.3   <EditieLabel> + final article-footer composition

5.B    Variant-specific components (depends on drill outcomes per variant)
        ├─ 5.B.int  <QASection> + <QARow> + <QASectionDivider> + <InterviewCredits>
        ├─ 5.B.col  Column-variant body touches (per 5.d-col outcome)
        ├─ 5.B.tra  Transfer-variant body touches (per 5.d-tra outcome)
        ├─ 5.B.evt  Event-variant detail block (per 5.d-evt outcome)
        └─ 5.B.mat  Match-variant detail block (per 5.d-mat outcome) — gates on #1470 if hero variant missing

5.C    Page integration + variant switch
        rewire apps/web/src/app/(main)/nieuws/[slug]/page.tsx to compose the new shell;
        switch on articleType injects the variant-specific overlays from 5.B.*

5.D    Cleanup
        ├─ Old docs/prd/article-detail-redesign.md removed
        ├─ Old article-detail-redesign milestone closed
        ├─ Legacy article-detail components retired
        ├─ #1543 closed (multi-line HighlighterStroke landed in 5.A.1)
        └─ CLAUDE.md "Implemented Routes" + "Redesign primitives" updated
```

All sub-issues spawn from this PRD via `/prd-to-issues`. No PRD update needed per variant — each drill round writes its locked mockup back to `docs/design/mockups/phase-5-article-detail/<round>/` and the corresponding implementation sub-issue (`5.B.<v>`) reads that mockup.

---

## 4. Component inventory

### New components

| Component               | Phase   | Role                                                                                                                                         |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `<QASection>`           | 5.B.int | `<MonoLabel>Q&A</MonoLabel>` heading + alternating `<QARow>` + `<QASectionDivider>`. Width pinned at `--container-prose`. Interview-only.    |
| `<QARow>`               | 5.B.int | Freight Display 900 number left · mono speaker tag · `text-display-sm` 600 question · `text-body-md` answer. Avatar slot per drill 5.d2.     |
| `<QASectionDivider>`    | 5.B.int | Dotted divider between Q&A rows. `flourish?: "diamond"` variant for major section breaks per drill 5.d3.                                     |
| `<InterviewCredits>`    | 5.B.int | Closing credits block (author / interviewees / photographer / publish date). Per drill 5.d-int.                                              |
| `<VerderLezenRow>`      | 5.A.2   | 3-up `<NewsCard>` row at article footer. Inherits R3 per-`articleType` backgrounds.                                                          |
| `<EditieLabel>`         | 5.A.3   | Editorial flourish (UI-only, derived from `publishedAt`: season + sequence count).                                                           |
| `<MatchRecapStats>`     | 5.B.mat | Inline match-stats block (composition per drill 5.d-mat). Spans both `matchPreview` (lineup/H2H) and `matchRecap` (final stats/goalscorers). |
| `<EventDetailBlock>`    | 5.B.evt | Full event detail card for the article body (composition per drill 5.d-evt). Companion to the existing hero day-block + compressed strip.    |
| `<TransferDetailBlock>` | 5.B.tra | Optional transfer body block (career history, fees if disclosed, etc — per drill 5.d-tra outcome; could be no-op).                           |

### Reused components

- `<EditorialHero placement="detail" variant={articleType}>` — Phase 4.5 R1.5 (#1749). Possibly refined by drill 5.d1.
- `<TapedCard>`, `<TapedFigure>`, `<TapeStrip>` — Phase 0–4.5
- `<EditorialHeading>` with accent decorator — Phase 0–1
- `<MonoLabel>`, `<MonoLabelRow>` — Phase 0–4.5
- `<DropCapParagraph>`, `<PullQuote>`, `<EndMark>` — Phase 1
- `<HighlighterStroke>` — Phase 0/1; multi-line support lands here (#1543)
- `<NewsCard>` flush-edge — Phase 4.5 R10
- `<StripedSeam>` — Phase 0
- Portable Text renderers + custom `accent` decorator — Phase 4.5

### EditorialHero variants pending other work

- `matchPreview` / `matchRecap` — gated on #1470. Their `<EditorialHero placement="detail">` variants need to land in #1470's PR. Phase 5 sub-issue `5.B.mat` blocks on #1470; the rest of the PRD does not.

---

## 5. Data layer

### GROQ — `ARTICLE_BY_SLUG_QUERY` audit (5.0)

The query already returns `titleRich`, `subjects[]`, `firstTransferFact`, `firstEventFact`, body PT. Audit confirms every field consumed by the new components ships through the projection.

Known projection extensions to investigate during 5.0:

- Q&A speakers + photographer credit on `subjects[]` or as dedicated fields. **Gate on drill 5.d2** — avatar source determines schema needs. If illustrated avatars win, no schema work; if photo crops win, projection extension only.
- Section-break markers in body PT — explicit PT block type vs renderer-side heading-boundary insertion. Decide at 5.A.1.
- Match data on the article — only needed if `5.d-mat` decides the body block surfaces match-level data not already on Sanity (e.g. lineups). Most likely fetched via BFF (PSD) rather than added to Sanity.

### Schema migrations

**Zero expected.** Confirmed in 5.0 audit. Any net-new field is spun out as a follow-up with explicit schema-migration scope, NOT folded into Phase 5.

### 5.0 tracer audit (2026-05-17, #1782)

Outcome: **no projection extension required.** `ARTICLE_BY_SLUG_QUERY` (`apps/web/src/lib/repositories/article.repository.ts:76`) already ships every field consumed by `<EditorialHero placement="detail" variant={articleType}>` for all four live variants. Per-variant verification:

| Variant        | Required hero props                                                                         | Projection source                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `announcement` | `title` / `titleRich` / `lead` / `coverImageUrl` / `category` (= `tags[0]`) / `publishedAt` | `title` (pt::text) + `titleRich` + `lead` + `coverImageUrl` + `tags` + `publishedAt` — all projected.                |
| `interview`    | `subjects[]` (playerRef + staffRef + custom\*) + `coverImagePortraitUrl`                    | `subjects[]{ _key, kind, playerRef->{…}, staffRef->{…}, customName, customRole, customPhotoUrl }` + portrait crop.   |
| `transfer`     | `feature: TransferFactValue` (first `transferFact` from body) + `otherClubLogoUrl`          | `body[]{ ..., "otherClubLogoUrl": select(_type == "transferFact" => …) }` — derived client-side by TransferTemplate. |
| `event`        | `feature: EventFactValue` (first `eventFact` from body) + `coverImageUrl`                   | `body[]{ ... }` spread carries every `eventFact` field — derived client-side by EventTemplate.                       |

Body PT shape: the `body[]{ ... }` spread preserves `marks[]` on text spans, so the `accent` decorator (a flat mark name — no markDef) ships unchanged. `markDefs[]{ ..., _type == "internalLink" => { ..., "reference": reference->{ _type, "slug": slug.current, psdId } } }` covers the only mark that needs reference expansion.

`firstTransferFact` / `firstEventFact` (present on `ARTICLES_QUERY` for card listings) are **intentionally absent** on `ARTICLE_BY_SLUG_QUERY`: the detail templates derive them by filtering `body[]` client-side (`TransferTemplate.tsx:68`, `EventTemplate.tsx:67`), so duplicating them at projection level would be dead data.

`matchPreview` / `matchRecap` remain gated on #1470; re-audit when those `articleType` values land.

---

## 6. Analytics

Per `feedback_analytics_prd_requirement`.

### Events

- `article_detail_view` — verify shape: `article_id` (hashed), `article_type`, `article_slug`, `reading_time_estimate`.
- `article_qa_section_in_view` — interview-only, fires on Q&A scrolled into view ≥ 250ms.
- `article_pull_quote_in_view` — per `<PullQuote>` in-view, `quote_position` (0-indexed).
- `article_verder_lezen_card_click` — `<VerderLezenRow>` click, `target_article_id` (hashed) + `target_article_type` + `source_article_id` (hashed).
- `article_match_stat_expand` — only if 5.d-mat adds an interactive stats block.
- `article_event_cta_click` — only if 5.d-evt adds a registration / ticket CTA.

### GTM / GA4

GTM regex `homepage_|news_|article_` covers the namespace; verify new event names match. New event parameters need DLV + GA4 Event-tag parameter mapping per `apps/web/CLAUDE.md` Analytics Checklist.

---

## 7. SEO + structured data

- `generateMetadata` already exports OG + canonical. Audit at 5.C.
- JSON-LD `Article` schema via `buildArticleJsonLd`. Audit when subjects + Q&A land — `Article.about` / `Article.mentions` may enumerate interview subjects.
- Sitemap unchanged.

---

## 8. Sub-issue tree — spawned 2026-05-17

19 issues spawned via the spawn script (`/tmp/spawn-phase5-issues.sh`); `blockedBy` edges wired via `addBlockedBy` GraphQL.

| Key     | Issue | Title                                                             | Blocked by                        | Status                   |
| ------- | ----- | ----------------------------------------------------------------- | --------------------------------- | ------------------------ |
| 5.0     | #1782 | tracer: `/nieuws/[slug]` route + ARTICLE_BY_SLUG_QUERY audit      | —                                 | ready (no design dep)    |
| 5.d1    | #1783 | drill: article header layout (centered vs flanked)                | —                                 | owner-led drill          |
| 5.d2    | #1784 | drill: subject avatar vocabulary (photo / monogram / illustrated) | —                                 | owner-led drill          |
| 5.d3    | #1785 | drill: section-break flourish (diamond vs alternatives)           | —                                 | owner-led drill          |
| 5.d4    | #1786 | drill: Verder-lezen + Editie footer layout                        | —                                 | owner-led drill          |
| 5.d-int | #1787 | drill: interview body touches (Q&A row + credits block layout)    | #1784, #1785                      | drill (after d2 + d3)    |
| 5.d-col | #1788 | drill: column / announcement variant body treatment               | #1783                             | drill (after d1)         |
| 5.d-tra | #1789 | drill: transfer variant body treatment                            | #1783                             | drill (after d1)         |
| 5.d-evt | #1790 | drill: event variant body detail block                            | #1783                             | drill (after d1)         |
| 5.d-mat | #1791 | drill: match variant body detail block (preview + recap)          | #1783, #1470                      | drill (after d1 + #1470) |
| 5.A.1   | #1792 | body container + DropCap + PT body + multi-line HighlighterStroke | #1782, #1785                      | blocked                  |
| 5.A.2   | #1793 | PullQuote + EndMark + VerderLezenRow                              | #1792, #1786                      | blocked                  |
| 5.A.3   | #1794 | EditieLabel + final footer composition                            | #1793                             | blocked                  |
| 5.B.int | #1795 | QASection + QARow + QASectionDivider + InterviewCredits           | #1787, #1794                      | blocked                  |
| 5.B.col | #1796 | column-variant body touches                                       | #1788, #1794                      | blocked                  |
| 5.B.tra | #1797 | transfer-variant body touches                                     | #1789, #1794                      | blocked                  |
| 5.B.evt | #1798 | EventDetailBlock                                                  | #1790, #1794                      | blocked                  |
| 5.B.mat | #1799 | MatchRecapStats                                                   | #1791, #1794, #1470               | blocked                  |
| 5.C     | #1800 | page.tsx rewire + variant switch                                  | #1795, #1796, #1797, #1798, #1799 | blocked                  |
| 5.D     | #1801 | cleanup — retire legacy, close legacy milestone, CLAUDE.md        | #1800                             | blocked                  |

Ralph picks up:

1. **#1782** (5.0 tracer) — immediately ready, no design dependency.
2. The drill issues (#1783 / #1784 / #1785 / #1786) — owner-led via `/design-an-interface`, not Ralph-driven.
3. Everything else unblocks as drills + 5.A.\* close.

---

## 9. Drill rounds (consolidated)

Per `feedback_design_drill_pattern`: **one decision per round, 3–4 visual options, owner picks, lock written to `docs/design/mockups/phase-5-article-detail/<round>/`.** No big-bang designs. The interview variant goes through the same drill cadence as the others, even though it has existing mockups — those mockups are inputs, not locks.

### Universal drills (apply to all variants)

| #    | Question                              | What to mock (3–4 options)                                                                                                                                                                                                                                | Resolves                                                                      |
| ---- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 5.d1 | Article header — centered or flanked? | (A) §5.2 flanked (current spec); (B) prompt §1 stacked / centered; (C) hybrid (centered title, flanked credit-chip row); (D) full-bleed cover photo with overlay title. Use one short headline + one long headline.                                       | Hero identity. Applies to all article variants.                               |
| 5.d2 | Subject avatar vocabulary             | (A) circular photo crop from `player.psdImage`; (B) initial monogram in jersey-deep disc; (C) illustrated character avatar (4–6 character vocabulary); (D) mixed (photo for credit chips, monogram for inline). Show at Q&A row scale + pull-quote scale. | Subject-presence vocabulary across `<QASection>` + `<PullQuote>` attribution. |
| 5.d3 | Section-break flourish                | (A) diamond glyph between sections; (B) `<StripedSeam height="sm">` mid-article; (C) plain dotted divider (today's default); (D) no break at all — just paragraph spacing.                                                                                | `<QASectionDivider flourish>` API + body section-break rendering.             |
| 5.d4 | Verder-lezen + Editie footer layout   | (A) single 3-up `<NewsCard>` row + Editie label below; (B) split — Verder-lezen on cream band, Editie on darker band; (C) full-bleed Verder-lezen with internal Editie chip; (D) sidebar Verder-lezen on desktop, stacked on mobile.                      | Article footer composition.                                                   |

### Variant-specific drills

| #       | Variant scope             | Question                                                                                            | What to mock (3–4 options)                                                                                                                                                                                                                                        |
| ------- | ------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.d-int | Interview                 | Q&A row composition (number style + speaker-tag layout) and `<InterviewCredits>` block              | Compose **two** sub-rounds in one drill: (Q&A) number-prefix style — display-numeral / mono index / blockquote glyph / no number · (Credits) layout — left-aligned list / centered block / sidebar / inline-with-EndMark.                                         |
| 5.d-col | Announcement / column     | What carries "column" identity when the body is text-first?                                         | (A) author-portrait taped figure in header; (B) `<MonoLabel>` column kicker + dropcap variant; (C) jersey-deep accent rule beside the body; (D) treat as default — no variant-specific touch.                                                                     |
| 5.d-tra | Transfer                  | How much transferFact data appears in body (the EditorialHero already shows direction + meta line)? | (A) no body block — Hero carries everything; (B) compact "career so far" mini-table; (C) `<TransferDetailBlock>` with old-club / new-club logos + arrow flourish below the dropcap; (D) inline fact pills in the body intro paragraph.                            |
| 5.d-evt | Event                     | Where does the full event detail card live, beyond the compressed strip in the hero?                | (A) below the EndMark as `<EventDetailBlock>` with CTA; (B) sticky CTA bar on scroll; (C) inline mid-body block at the first `<h2>`; (D) sidebar on desktop.                                                                                                      |
| 5.d-mat | matchPreview + matchRecap | What does the match detail body block carry?                                                        | (A) lineups (preview) / final stats grid (recap); (B) goalscorer roll-call + ticket-stub key moments; (C) embedded score widget (`<ScoreboxStrip>`); (D) link out to `/wedstrijd/[matchId]` only (no inline). Treat preview + recap symmetrically where possible. |

### Pre-resolved (no drill needed)

- ~~Editie 47 line — UI or schema?~~ **UI-only**, auto-derived from `publishedAt`.
- ~~Whether interview gets its own drill round.~~ **Yes** — same cadence as other variants; existing master-plan §5.2 mock is an input to drill 5.d-int, not a lock.

---

## 10. Open questions

1. **Header layout** — drill 5.d1.
2. **Avatar vocabulary** — drill 5.d2.
3. **Multi-line `<HighlighterStroke>`** (#1543) — locks during 5.A.1 implementation. Five sub-questions parked on the issue body: server vs client / resize / per-line variant / SSR fallback / API surface.
4. **`matchPreview` / `matchRecap` EditorialHero detail variants** — owned by #1470. `5.B.mat` is blocked on #1470 landing them; the rest of Phase 5 is not.
5. **Variant-specific deltas** — drills 5.d-int, 5.d-col, 5.d-tra, 5.d-evt, 5.d-mat lock these.

---

## 11. Discovered unknowns

_Empty at PRD authoring time. Append entries here when implementation surfaces something unexpected._

```text
[YYYY-MM-DD] Description of unknown surfaced during implementation. Disposition: resolved in-PR / spun out as #NNNN / deferred to Phase X.
```
