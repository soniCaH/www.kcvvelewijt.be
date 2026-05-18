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

**Sanity migrations required:** 2 deliberate exceptions to the original "0 migrations" guarantee.

1. **2026-05-18, drill 5.d-int.** `<ArticleCredits>` needed `author` + `photographer` on `article`. Both added as optional `string` fields per `packages/sanity-schemas/src/article.ts`. No backfill (existing docs render as undefined → omitted credit rows).
2. **2026-05-18, #1795 (5.B.int).** `qaPair.{answer,respondentKey}` replaced with a `respondents: qaPairRespondent[]` array to natively model multi-respondent answers (duo / panel interviews). Migration script `packages/sanity-studio/src/migrations/qa-pair-respondents.ts` wraps each legacy `{answer,respondentKey}` pair into a 1-element array and unsets the legacy fields. **Idempotent + tested** — safe to re-run. **0 production interviews / 4 staging interviews** at PR time, so the migration runs against staging only (no production data risk). New `qaPairRespondent` object type added to the schema registry.

All other body fields (`articleType`, `subjects[]`, body PT blocks, `firstTransferFact`, `firstEventFact`) already on schema.

**Retired post-audit (2026-05-18):** `<EditieLabel>` ("Editie 47 · Lente 2026 · KCVV Elewijt Magazine" line) — see `docs/design/mockups/phase-5-article-detail/footer-locked.md`. KCVV is a club site, not a magazine; the data didn't exist (no edition number on `article`) and the surface was invented chrome. Drops out of the shared body shell, retires `<EditieLabel>` from §3 phasing and §6 new-components table, and downgrades drill 5.d4 to a lock-by-inheritance close.

**Renamed post-audit (2026-05-18):** `<InterviewCredits>` → `<ArticleCredits>` (drill 5.d-int Round 2). Variant-agnostic — interview is its first consumer; future photo-gallery variant reuses verbatim. See `docs/design/mockups/phase-5-article-detail/interview-locked.md`.

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
        └─ 5.A.2   <PullQuote> placement + <EndMark> + <VerderLezenRow>
        # 5.A.3 retired 2026-05-18 — <EditieLabel> killed post data-audit;
        # final footer composition collapses into 5.A.2.

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

| Component               | Phase   | Role                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<QASection>`           | 5.B.int | `<MonoLabel>Q&A</MonoLabel>` heading + alternating `<QARow>` + `<QASectionDivider>`. Width pinned at `--container-prose`. Interview-only.                                                                                                                                                                                                                                                                                     |
| `<QARow>`               | 5.B.int | Mono speaker tag · monogram avatar (5.d2 D lock) · `text-display-sm` 600 question · `text-body-md` answer. **Drill 5.d-int Round 1 LOCKED 2026-05-18 → no left-column ordinal marker; grid collapses from 3-col to 2-col (avatar + body).**                                                                                                                                                                                   |
| `<QASectionDivider>`    | 5.B.int | Dotted divider between Q&A rows; `title` variant (italic centered + flanking 1px ink rules at 0.55 opacity) for major section breaks per drill 5.d3. **Drill 5.d3 LOCKED 2026-05-18 → no `flourish="diamond"` variant added; existing `flourish="em-dash" \| "star"` API is unchanged.**                                                                                                                                      |
| `<ArticleCredits>`      | 5.B.int | Closing credits block: Door (author) · Met (subjects[]) · Beeld (photographer) · Gepubliceerd (publishedAt). Centered framed block, 1px ink rules top + bottom, prose width. **Drill 5.d-int Round 2 LOCKED 2026-05-18 → renamed from `<InterviewCredits>` for variant-agnostic reuse (future photo-gallery); rows drop when source field blank; all fields optional except `subjects[]` (required by interview validator).** |
| `<VerderLezenRow>`      | 5.A.2   | 3-up `<NewsCard>` row at article footer. Inherits R3 per-`articleType` backgrounds.                                                                                                                                                                                                                                                                                                                                           |
| `<MatchRecapStats>`     | 5.B.mat | Inline match-stats block (composition per drill 5.d-mat). Spans both `matchPreview` (lineup/H2H) and `matchRecap` (final stats/goalscorers).                                                                                                                                                                                                                                                                                  |
| `<EventDetailBlock>`    | 5.B.evt | Full event detail card for the article body (composition per drill 5.d-evt). Companion to the existing hero day-block + compressed strip.                                                                                                                                                                                                                                                                                     |
| `<TransferDetailBlock>` | 5.B.tra | Optional transfer body block (career history, fees if disclosed, etc — per drill 5.d-tra outcome; could be no-op).                                                                                                                                                                                                                                                                                                            |

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

- Q&A speakers + photographer credit on `subjects[]` or as dedicated fields. **5.d2 LOCKED → D (monogram at row, photo at attribution).** Photo sources (`playerRef.psdImage` / `staffRef.photo` / `customPhoto`) already ship through `subjects[]` per the 5.0 tracer audit (§5.0 below) — no projection extension required.
- Section-break markers in body PT — explicit PT block type vs renderer-side heading-boundary insertion. **LOCKED 2026-05-18 in #1792 → heading-derived.** The `<ArticleBody>` PT serializer maps `style: "h2"` body blocks to `<QASectionDivider title={[block]} />`, reusing the existing Phase 3-b primitive verbatim per the 5.d3 lock. No new `sectionBreak` block type, no schema migration. Inline `accent` marks on the h2 ride through to the divider's accent renderer. Editor-facing: the body editor's h2 toolbar button is the natural section-break gesture.
- Match data on the article — only needed if `5.d-mat` decides the body block surfaces match-level data not already on Sanity (e.g. lineups). Most likely fetched via BFF (PSD) rather than added to Sanity.

### Schema migrations

**Two deliberate exceptions (2026-05-18).** Originally 0 expected and confirmed so by the 5.0 audit. Both surfaced from data-audit work during drill 5.d-int + the 5.B.int build (#1795):

1. **`article.author` + `article.photographer`** (drill 5.d-int Round 2) — both added as optional `string` fields in `packages/sanity-schemas/src/article.ts`. No backfill required; existing documents return `undefined` and `<ArticleCredits>` drops the empty rows. Studio surfaces them as "Auteur (Door)" + "Fotograaf (Beeld)" inputs.
2. **`qaPair.respondents[]` schema migration** (5.B.int / #1795) — replaced the singular `qaPair.answer` + `qaPair.respondentKey` fields with a `respondents: qaPairRespondent[]` array to natively model multi-respondent answers (duo / panel interviews). Migration script at `packages/sanity-studio/src/migrations/qa-pair-respondents.ts` wraps each legacy `{answer, respondentKey}` pair into a single-element `respondents[]` entry and unsets the legacy fields. Migration is idempotent (existing populated `respondents` is left alone) and unit-tested. 0 production interviews / 4 staging interviews at PR time, so the migration is staging-only in practice. New `qaPairRespondent` object type registered in `packages/sanity-schemas/src/index.ts`.

Any further net-new field beyond these two is spun out as a follow-up with explicit schema-migration scope, NOT folded into Phase 5.

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

| Key     | Issue | Title                                                             | Blocked by                        | Status                                                                                                                                               |
| ------- | ----- | ----------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.0     | #1782 | tracer: `/nieuws/[slug]` route + ARTICLE_BY_SLUG_QUERY audit      | —                                 | ready (no design dep)                                                                                                                                |
| 5.d1    | #1783 | drill: article header layout (centered vs flanked)                | —                                 | LOCKED 2026-05-18 → E0 (Phase 3-b shell stands)                                                                                                      |
| 5.d2    | #1784 | drill: subject avatar vocabulary (photo / monogram / illustrated) | —                                 | LOCKED 2026-05-18 → D (mono @32px, photo @64px w/ mono fallback)                                                                                     |
| 5.d3    | #1785 | drill: section-break flourish (diamond vs alternatives)           | —                                 | LOCKED 2026-05-18 → E0 (Phase 3-b thin-rule subtitle; no `flourish="diamond"`)                                                                       |
| 5.d4    | #1786 | drill: Verder-lezen footer layout                                 | —                                 | LOCKED 2026-05-18 (inheritance — no drill needed; `<EditieLabel>` retired)                                                                           |
| 5.d-int | #1787 | drill: interview body touches (Q&A row + credits block layout)    | —                                 | LOCKED 2026-05-18 → R1 D (no number marker); R2 B (centered framed `<ArticleCredits>` block; renamed from InterviewCredits + 2 schema fields added)  |
| 5.d-col | #1788 | drill: column / announcement variant body treatment               | —                                 | LOCKED 2026-05-18 → A (monogram author chip in `<EditorialByline>`; all announcements; no column discriminator)                                      |
| 5.d-tra | #1789 | drill: transfer variant body treatment                            | —                                 | LOCKED 2026-05-18 → D + adjacency rule (TapedCard per additional transferFact; consecutive → 2-up grid, isolated → 1-up)                             |
| 5.d-evt | #1790 | drill: event variant body detail block                            | —                                 | LOCKED 2026-05-18 → A (EventDetailBlock after EndMark) + past-event badge rule + skip-condition (only when sessions/address/capacity/note add value) |
| 5.d-mat | #1791 | drill: match variant body detail block (preview + recap)          | #1783, #1470                      | drill (after d1 + #1470)                                                                                                                             |
| 5.A.1   | #1792 | body container + DropCap + PT body + multi-line HighlighterStroke | #1782, #1785                      | blocked                                                                                                                                              |
| 5.A.2   | #1793 | PullQuote + EndMark + VerderLezenRow                              | #1792, #1786                      | blocked                                                                                                                                              |
| 5.A.3   | #1794 | ~~EditieLabel + final footer composition~~                        | n/a                               | CLOSED 2026-05-18 (`<EditieLabel>` retired; final footer collapses into 5.A.2)                                                                       |
| 5.B.int | #1795 | QASection + QARow + QASectionDivider + ArticleCredits             | #1793                             | blocked (#1787 locked 2026-05-18; ready once #1793 lands)                                                                                            |
| 5.B.col | #1796 | column-variant body touches                                       | #1788, #1793                      | blocked                                                                                                                                              |
| 5.B.tra | #1797 | transfer-variant body touches                                     | #1789, #1793                      | blocked                                                                                                                                              |
| 5.B.evt | #1798 | EventDetailBlock                                                  | #1790, #1793                      | blocked                                                                                                                                              |
| 5.B.mat | #1799 | MatchRecapStats                                                   | #1791, #1793, #1470               | blocked                                                                                                                                              |
| 5.C     | #1800 | page.tsx rewire + variant switch                                  | #1795, #1796, #1797, #1798, #1799 | blocked                                                                                                                                              |
| 5.D     | #1801 | cleanup — retire legacy, close legacy milestone, CLAUDE.md        | #1800                             | blocked                                                                                                                                              |

Ralph picks up:

1. **#1782** (5.0 tracer) — immediately ready, no design dependency.
2. The drill issues (#1783 / #1784 / #1785 / #1786) — owner-led via `/design-an-interface`, not Ralph-driven.
3. Everything else unblocks as drills + 5.A.\* close.

---

## 9. Drill rounds (consolidated)

Per `feedback_design_drill_pattern`: **one decision per round, 3–4 visual options, owner picks, lock written to `docs/design/mockups/phase-5-article-detail/<round>/`.** No big-bang designs. The interview variant goes through the same drill cadence as the others, even though it has existing mockups — those mockups are inputs, not locks.

### Universal drills (apply to all variants)

| #    | Question                                                                                                                             | What to mock (3–4 options)                                                                                                                                                                                                                                                                                                                                                                                                                                               | Resolves                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 5.d1 | ~~Article header — centered or flanked?~~ **LOCKED 2026-05-18 → E0 (existing Phase 3-b `<EditorialHeroShell>` 60/40 shell stands).** | ~~(A) flanked / (B) stacked / (C) hybrid / (D) full-width spotlight~~ — all four alternatives required dropping locked primitives; comparison confirmed the Phase 3-b lock holds. Mockups: `docs/design/mockups/phase-5-article-detail/5d1-header/`. Lock: `header-locked.md`. Per-variant overlays drilled inside each variant drill (5.d-int / 5.d-tra / 5.d-evt / 5.d-mat).                                                                                           | Universal hero shell for every article variant (= Phase 3-b lock).                   |
| 5.d2 | ~~Subject avatar vocabulary~~ **LOCKED 2026-05-18 → D (scale-conditional).**                                                         | ~~(A) photo / (B) monogram / (C) illustration / (D) mixed~~ — `<QASection>` row scale (~32px) renders **monograms** (first initial of `customName` if provided, else `firstName`, on a `bg-jersey-deep` disc, cream full opacity). `<PullQuote>` attribution scale (~64px) renders **circular photo crops** with R9 newsprint treatment, falling back to a 64px monogram (same derivation rule) when no photo exists. Mockups: `5d2-avatars/`. Lock: `avatar-locked.md`. | Subject-presence vocabulary across `<QASection>` + `<PullQuote>` attribution.        |
| 5.d3 | ~~Section-break flourish~~ **LOCKED 2026-05-18 → E0 (Phase 3-b `<QASectionDivider title>` thin-rule subtitle stands).**              | ~~(A) diamond glyph / (B) StripedSeam / (C) dotted divider / (D) no break~~ — all four rejected against the existing Phase 3-b thin-rule subtitle treatment (italic centered + flanking 1px ink rules at 0.55 opacity); a glyph above the rules is redundant. No `flourish="diamond"` added to the API. Mockups: `5d3-section-break/`. Lock: `section-break-locked.md`.                                                                                                  | `<QASectionDivider flourish>` API + body section-break rendering. No new vocabulary. |
| 5.d4 | ~~Verder-lezen + Editie footer layout~~ **LOCKED 2026-05-18 → inheritance (no drill needed).**                                       | The four originally-proposed options (A stacked / B split bands / C full-bleed + Editie chip / D sidebar) were all framed around `<EditieLabel>` placement. Post data-audit, `<EditieLabel>` is retired (KCVV is not a magazine; the data doesn't exist). Footer collapses to a single `<VerderLezenRow>` inheriting Phase 4.5 R10 flush-edge `<NewsCard>` + R3 per-`articleType` background lookup. See `docs/design/mockups/phase-5-article-detail/footer-locked.md`.  | Article footer composition. (= Phase 4.5 R10 + R3 inheritance, no Editie.)           |

### Variant-specific drills

| #       | Variant scope             | Question                                                                                                                                                                                                                                                                                                          | What to mock (3–4 options)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.d-int | Interview                 | ~~Q&A row composition (number style + speaker-tag layout) and `<InterviewCredits>` block~~ **LOCKED 2026-05-18 → Round 1 D (no number marker); Round 2 B (centered framed credits block) with schema extension.**                                                                                                 | ~~Round 1: display-numeral / mono index / blockquote glyph / no number · Round 2: left-aligned list / centered block / sidebar / inline-with-EndMark~~. **Locked:** `<QARow>` drops left-column ordinal (2-col grid: avatar + body). `<ArticleCredits>` (renamed from `<InterviewCredits>` for variant-agnostic reuse incl. future photo-gallery) renders as centered framed block with 1px ink rules; rows labeled `Door / Met / Beeld / Gepubliceerd`; all source fields optional, rows drop when blank. Two new optional `article` fields added (`author`, `photographer`). See `5d-int/round-1-*.html`, `5d-int/round-2-*.html`, `interview-locked.md`. |
| 5.d-col | Announcement / column     | ~~What carries "column" identity when the body is text-first?~~ **LOCKED 2026-05-18 → A (monogram author chip beside byline).** Path 2 picked (no column-vs-announcement discriminator; lock applies to every announcement).                                                                                      | ~~(A) author-portrait taped figure / (B) MonoLabel COLUMN kicker + heavier dropcap / (C) jersey-deep accent rule / (D) default — no touch~~. **Locked:** `<EditorialByline>` gains a 24px monogram disc inline-prefix slot, rendered when `article.author` is populated (using 5.d-int schema addition + 5.d2 monogram primitive). Drops gracefully when author is blank. Originally-proposed Option B (`<MonoLabel>` COLUMN kicker) dropped at brief level — required a data signal (`isColumn` boolean / `tags` convention) we don't have. See `5d-col/`, `announcement-locked.md`.                                                                       |
| 5.d-tra | Transfer                  | ~~How much transferFact data appears in body?~~ **LOCKED 2026-05-18 → D + adjacency rule.** Body renders additional transferFact blocks (beyond the first which powers the hero) as compact `<TapedCard>`s in PortableText flow.                                                                                  | ~~Original A/B/C/D reframed mid-drill (every transferFact field already in hero; only body-real treatment is multi-transferFact rendering).~~ **Locked:** TapedCard per additional transferFact; consecutive transferFacts auto-flow into 2-up grid, isolated transferFacts render 1-up at prose width. Editor controls placement. No new schema fields. See `5d-tra/`, `transfer-locked.md`.                                                                                                                                                                                                                                                               |
| 5.d-evt | Event                     | ~~Where does the full event detail card live, beyond the compressed strip in the hero?~~ **LOCKED 2026-05-18 → A (after EndMark) + past-event badge rule.** `<EventDetailBlock>` renders at article end between EndMark and ArticleCredits when sessions / address / capacity / note adds value beyond the strip. | ~~A/B/C/D~~ — A locked. Past-event treatment: badge ("Afgelopen") replaces the kicker tag, CTA hidden, rest of card visible (sessions / address / capacity stay as historical record). Skip-condition rule: block only renders when sessions[] OR address OR capacity OR note is populated (simple single-day events covered by the strip alone). `isPast` boolean computed page-level. No new schema. See `5d-evt/`, `event-locked.md`.                                                                                                                                                                                                                    |
| 5.d-mat | matchPreview + matchRecap | What does the match detail body block carry?                                                                                                                                                                                                                                                                      | (A) lineups (preview) / final stats grid (recap); (B) goalscorer roll-call + ticket-stub key moments; (C) embedded score widget (`<ScoreboxStrip>`); (D) link out to `/wedstrijd/[matchId]` only (no inline). Treat preview + recap symmetrically where possible.                                                                                                                                                                                                                                                                                                                                                                                           |

### Pre-resolved (no drill needed)

- ~~Editie 47 line — UI or schema?~~ **RETIRED 2026-05-18.** Post data-audit: KCVV is a club site, not a magazine; no edition data exists, no editorial workflow produces it, and the surface was invented chrome. See `docs/design/mockups/phase-5-article-detail/footer-locked.md` for the reasoning.
- ~~Whether interview gets its own drill round.~~ **Yes** — same cadence as other variants; existing master-plan §5.2 mock is an input to drill 5.d-int, not a lock.

---

## 10. Open questions

1. ~~**Header layout**~~ — locked 2026-05-18 (5.d1 → E0).
2. ~~**Avatar vocabulary**~~ — locked 2026-05-18 (5.d2 → D scale-conditional).
3. ~~**Multi-line `<HighlighterStroke>`**~~ (#1543) — **locked 2026-05-18 in 5.A.1 (#1792).** See §10 Q3 ADR below.
4. **`matchPreview` / `matchRecap` EditorialHero detail variants** — owned by #1470. `5.B.mat` is blocked on #1470 landing them; the rest of Phase 5 is not.
5. **Variant-specific deltas** — ~~5.d-int locked 2026-05-18~~; drills 5.d-col, 5.d-tra, 5.d-evt, 5.d-mat still pending.

### Q3 ADR — Multi-line `<HighlighterStroke>` technical approach (closes #1543)

**Decided 2026-05-18 in #1792.** `<HighlighterStroke>` stays a Server Component and uses CSS `box-decoration-break: clone` on the existing inline `background-image` to repeat the stroke per visual line. **No JavaScript, no API change, no SSR/CSR split.**

#### Implementation

```typescript
// HighlighterStroke.tsx (delta only)
style={{
  backgroundImage: `url("${dataUrl}")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "0 88%",
  backgroundSize: "100% 0.4em",
  paddingBottom: "0.1em",
  WebkitBoxDecorationBreak: "clone",
  boxDecorationBreak: "clone",
}}
```

`box-decoration-break: clone` instructs the browser to clone the background (and padding / border) per inline fragment. On wrap, each visual line becomes its own fragment with its own bounding box, and `background-size: 100% 0.4em` stretches the stroke across each line's width independently.

#### Answers to #1543's 5 sub-questions

1. **Server vs client component.** Server. CSS is sufficient; `Range.getClientRects()` is not needed.
2. **Resize behaviour.** Native browser reflow re-renders the background per fragment on every resize. No `ResizeObserver`, no debounce, no JS.
3. **Stroke per line.** Same `STROKE_PATH` (the asymmetric hand-pulled SVG) repeats per visual line. The path's mild horizontal asymmetry repeats uniformly per line, which reads as a real-marker idiom rather than a mechanical pattern.
4. **SSR fallback.** N/A — the server output IS the final output. There is no hydration upgrade step, so there is no fallback / mismatch surface.
5. **API surface.** `<HighlighterStroke color={...}>{children}</HighlighterStroke>` is unchanged.

#### Caveats

- `-webkit-box-decoration-break` prefix shipped for older Safari (still relevant — caniuse 2026-05).
- Per-line stroke is identical (same `STROKE_PATH`). If editorial intent ever demands variation (e.g. distinct path per line for organic feel), that earns a follow-up issue with a per-line wrapper that owns its own DOM emission and `ResizeObserver`. Today's vocabulary does not need it.

#### Test coverage

- Storybook: `Playground`, `InAHeading`, `ColorVariants` retain their VR baselines. The Phase 0 `MultiLineUnsupported` story is **renamed** to `MultiLineWrapping` (no longer "unsupported"), its `parameters.vr.disable` is removed, and a VR baseline is added.

#### Rollback

Remove `boxDecorationBreak` / `WebkitBoxDecorationBreak` from the inline `style` object. The Phase 0 single-line behaviour returns unchanged.

---

## 11. Discovered unknowns

_Empty at PRD authoring time. Append entries here when implementation surfaces something unexpected._

```text
[2026-05-18] <EditieLabel> ("Editie 47 · Lente 2026 · KCVV Elewijt Magazine" line) was carried over from the retro-terrace-fanzine visual baseline without a data audit. KCVV doesn't publish in numbered editions and isn't a magazine — the surface was invented chrome. Disposition: retired in-PR (drill 5.d4 / #1786) per `feedback_design_data_audit`; #1794 closed as no-op; references purged from PRD §1/§3/§4/§8/§9/§10 and brief §5.

[2026-05-18] <InterviewCredits> mocked with fabricated `author`, `photographer`, `location` fields that don't exist on `article`. Data audit during drill 5.d-int Round 2 surfaced the gap (same root cause as the EditieLabel retirement). Disposition: two new optional fields added to `article` (`author`, `photographer`) — deliberate exception to PRD §1's "0 migrations" guarantee. `location` rejected (body-text fold-in if needed). Component renamed `<ArticleCredits>` for variant-agnostic reuse (future photo-gallery variant inherits verbatim). Locked in `interview-locked.md`; #1795 title in PRD §8 updated.

[2026-05-18] Drill 5.d-col scope ambiguity: PRD said "announcement doubles as column variant" but Sanity has no `column` discriminator. Mid-drill clarification surfaced two paths (Path 1: add discriminator + per-flavor treatment; Path 2: one treatment for all announcements). Disposition: Path 2 picked; originally-proposed Option B (`<MonoLabel>` COLUMN kicker, which assumed Path 1) dropped at brief level. Drill resolved with Option A (monogram author chip in `<EditorialByline>`) — composes from existing primitives (5.d-int `article.author` + 5.d2 monogram), no new chrome. Lock in `announcement-locked.md`.

[2026-05-18] Drill 5.d-tra audit revealed: (a) all `transferFact` fields are already consumed by the hero (Phase 3-b R1.5 lock), so the body has nothing variant-specific to add for single-transfer articles; (b) `transferFact` carries `playerName` as a denormalized string with NO `playerRef` link to the `player` document — meaning hero player photos come only from manually-uploaded `article.coverImage` (PSD `player.psdImage` never auto-used). The drill resolved against (a) by drilling the schema-promised "subsequent transferFact renders as overview row" treatment instead: Option D (TapedCard per transferFact) + adjacency rule. The (b) playerRef gap is recorded as a follow-up — out of Phase 5 scope per the issue's own scope note. Two possible fixes: add `playerRef` to `transferFact`, or open `subjects[]` to transfer articles (currently `hidden: articleType !== "interview"`).

[2026-05-18] h2 body section break — the 5.d3 lock's prose literally specifies the inline rules at 0.55 opacity and the title at Freight Display 900, but its rationale ("E0 — Phase 3-b `<QASectionDivider title>` thin-rule subtitle stands. Net new primitives: None. ships verbatim.") delegates the rendering to the existing primitive. `<QASectionDivider>` currently ships with rules at 100% opacity (`bg-ink`) and the title at font-semibold (~600), not 0.55 + 900. **RESOLVED — Path B (spec adjusted to match implementation).** `<ArticleBody>` (`apps/web/src/components/article/ArticleBody/ArticleBody.tsx`) delegates body h2 to `<QASectionDivider>` (`apps/web/src/components/design-system/QASectionDivider/QASectionDivider.tsx`) verbatim, at its current rendering (100% rules, weight ~600). The 5.d3 lock's "ships verbatim" rationale governs over the numeric specifics in its body copy; the 0.55 / 900 numbers are read as imprecise prose rather than a contract. Authoritative for implementers of #1792 and every downstream consumer: **do not rebuild the geometry inline, do not alter QASectionDivider's tokens for this surface, delegate verbatim.** If editorial intent later genuinely demands the 0.55 / 900 refinement, that opens a separate Phase 3-b follow-up against QASectionDivider's own implementation (affects every existing Phase 3-b consumer — outside Phase 5 scope).

[2026-05-18] DropCap-target first paragraph flattens inline `accent` marks. `<DropCapParagraph>` accepts `children: string` so the CSS `:first-letter` pseudo-element targets a top-level text node; a ReactNode children type would require either nested-element gymnastics or moving the drop cap off the first letter. Disposition (in #1792): document the limitation in the renderer + a dedicated test (`flattens marks on the first paragraph (DropCap-target limitation)`), and leave the API change as a Phase 5 follow-up if editorial demands mark support inside the lead paragraph. Today the editorial convention is to put the accent on a later paragraph anyway — no urgent need.

[2026-05-18] Related-articles fetching audit (in #1793). The 5.A.2 brief asked for "extend or reuse `RELATED_ARTICLES_QUERY` to return up to 3 articles by tag overlap." Audit outcome: **reuse, do not extend.** The existing `apps/web/src/lib/repositories/article.repository.ts` already projects `relatedArticles[]` (editor-curated) on every article-by-slug fetch, and `apps/web/src/app/(main)/nieuws/[slug]/page.tsx` falls back to `BffService.getRelated(article.id)` for backlink-driven recommendations when no curated set exists. The result feeds `mergeRelatedItems` (`apps/web/src/lib/utils/article-related-items.ts`) which already produces the union-typed `RelatedContentItem[]` the existing `<RelatedContentSection>` consumes. Disposition: `<VerderLezenRow>` ships article-only with a typed `VerderLezenItem` interface; the `RelatedContentItem[]` → `VerderLezenItem[]` filtering + mapping lives at the page level (5.C, #1800). A tag-overlap GROQ extension was rejected as net-new query work that does not unblock 5.A.2 and would compete with the existing curated + backlinks logic on the same surface — open a follow-up only if the editor team explicitly asks for tag-overlap behaviour distinct from curated/backlinks.

[2026-05-18] `--container-page: 1120px` token added (in #1793). The 5.d4 lock named this token by spec ("`<VerderLezenRow>` ... at `--container-page` width") but it did not exist in `apps/web/src/app/globals.css`. Disposition: added the token between the existing `--container-prose: 680px` and `--container-default: 1200px` entries. Consumers: `<VerderLezenRow>` only today; reserved for any future "wider than prose but narrower than default" article-footer surfaces.

[2026-05-18] `<PullQuote>` attribution layout flipped to a two-line stack when an `avatarSlot` is provided (in #1793). Existing API surface: `attribution: { name, role?, source? }` (mono caps inline row); new API: optional `avatarSlot?: ReactNode` prop. When supplied (typical: `<SubjectAvatar scale="attribution" />`), the row becomes `[avatar] [italic display name / mono caps role · source]`. When omitted, the original inline mono caps row renders unchanged — preserves the external-source quote path. No production consumers existed at refactor time, so the API addition is safe.

[2026-05-18] `qaPair` schema restructure — multi-respondent support (in #1795). Legacy shape: `qaPair.{question, answer, tag, respondentKey}`. New shape: `qaPair.{question, tag, respondents: qaPairRespondent[]}`. Each `qaPairRespondent` entry pairs a `respondentKey` with its own Portable Text answer; the lock at `docs/design/mockups/phase-5-article-detail/interview-locked.md` only specified single-respondent rows but the owner explicitly asked for multi-respondent on 2026-05-18 (duo / panel interviews). Schema migration `packages/sanity-studio/src/migrations/qa-pair-respondents.ts` wraps existing single-respondent pairs into a 1-element array and unsets the legacy fields. Migration is idempotent + unit-tested. 0 production interviews / 4 staging interviews at PR time — staging-only migration in practice. New `qaPairRespondent` object type added to `packages/sanity-schemas/src/index.ts`. Renderer impact: new `<QARow>` natively consumes the `respondents[]` array (single-respondent renders the canonical avatar-tag-question-answer column; multi-respondent lifts the question to full width and stacks per-respondent answer blocks below). Legacy `<QaBlock>` + sub-components (`QaPairStandard`, `QaPairKey`, `QaPairQuote`, `QaGroupRapidFire`) flatten `respondents[0]` for the existing visual variants — multi-respondent rendering is exclusive to the new `<QARow>`. Documented as the second deliberate exception to PRD §1's "0 migrations" guarantee.

[2026-05-18] `<EditorialByline>` author-wiring AC (5.B.int, #1795) — **deferred to 5.C (#1800).** The AC reads "once `author` lands, the byline reads `article.author ?? 'Door redactie'`." #1795 makes the data available (GROQ projects `author` + `photographer`; repository row exposes them; `renderTemplate` threads `author` into every template via the shared `common` spread), but the legacy templates (`InterviewTemplate`, `AnnouncementTemplate`, `TransferTemplate`, `EventTemplate`) use variant-specific heroes (`InterviewHero`, `AnnouncementHero`, ...) that **don't consume `author` and don't render `<EditorialByline>`**. The actual byline replacement happens at 5.C when `page.tsx` rewires the templates to compose `<EditorialHero>` (which already reads `author` and renders `<EditorialByline>` per Phase 3-b). For #1795 the wiring lands on the data side; the visible byline change waits one sub-issue.

[2026-05-18] `qaPair` migration "mixed-state" edge case (in #1795). The migration script (`packages/sanity-studio/src/migrations/qa-pair-respondents.ts`) treats any non-empty `respondents` array as "already migrated" and skips the pair, even when stale legacy `answer` / `respondentKey` fields linger alongside. The orphan legacy fields will not render (the schema no longer declares them) but stay in the document indefinitely. Disposition: accept — the cost of detecting + emitting `unset()` patches for the orphan fields outweighs the runtime impact (no render, no validation noise) on a staging-only migration with 4 documents. If the same migration ever runs on a larger dataset, revisit and add the cleanup branch.
```
