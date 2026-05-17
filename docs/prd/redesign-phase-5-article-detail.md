# PRD — Phase 5 · Article Detail Redesign

**Status:** skeleton — interview variant scoped; non-interview variants gate on per-variant design drill rounds.
**Authored:** 2026-05-17.
**Owner:** @climacon.
**Predecessor:** Phase 4.5 homepage refinement (#1745, all R1–R10 locks merged).
**Tracker:** #1527.
**Brief / design input:** `docs/design/phase-5-article-detail-brief.md` (consolidated brief — system inheritance + owner refinement prompts + open drill questions).
**Master plan:** `docs/plans/2026-04-27-redesign-master-design.md` §5.2 (duo interview) + §6.2 (non-interview variants).
**Superseded:** the legacy `docs/prd/article-detail-redesign.md` + `article-detail-redesign` milestone close when this work merges.

---

## 1. Scope

Rebuild `/nieuws/[slug]` for all `article.articleType` values with the retro-terrace-fanzine vocabulary established in Phase 4.5. Six article variants:

| Variant      | Status at PRD authoring                                                                     | Owner-direction notes                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Interview    | **Mocked** (`docs/design/mockups/retro-terrace-fanzine/duo-interview-{desktop,mobile}.png`) | Header / Q&A / pull-quote drill rounds open — see brief §5 Q1+Q2. PRD scopes interview-first implementation. |
| Matchverslag | Not mocked. Variant inherits all system locks; needs header + body-flow drill.              | Pending.                                                                                                     |
| Column       | Not mocked. Likely shares Interview body composition minus `<QASection>`.                   | Pending.                                                                                                     |
| Transfer     | Not mocked. EditorialHero variant already exists (#1638 / #1749); article body needs drill. | Pending.                                                                                                     |
| Jeugd        | Not mocked. Likely matchverslag-like with youth-specific kicker / subject treatment.        | Pending.                                                                                                     |
| Evenement    | Not mocked. EditorialHero event variant exists; body needs drill.                           | Pending.                                                                                                     |
| Generic      | Not mocked. Fallback for legacy untyped articles.                                           | Pending — may collapse into a "default" style without its own drill if owner agrees.                         |

**Goal:** ship the Interview rebuild first (it has a locked mock + brief), then drill each non-interview variant in sequence, then implement, then close.

**Sanity migrations required:** 0 expected. The `articleType` field + `subjects[]` already exist. Body composition primitives are React-only. **Open follow-up — Editie line:** UI-only auto-derived from `publishedAt`; no schema field unless editorial demand surfaces during build.

---

## 2. System inheritance — non-negotiable

All Phase 4.5 + earlier locks apply. **Do not re-derive in any Phase 5 round.** Quote the brief §1 instead.

### Phase 4.5 R9 — Photo treatment

`--filter-photo-newsprint` + `--pattern-paper-grain` + `--shadow-photo-tape` apply to every `<TapedFigure>`. `data-tint="none"` is the per-instance opt-out for designed graphics. Layered "lift" hover Variant A is RETIRED (#1748).

### Phase 4.5 R10 — Card structure

`<NewsCard>` flush-edge structure consumed by the "Verder lezen" related row at article footer. Outer `<TapedCard>` is the only frame; no nested `<TapedFigure>` inside `<NewsCard>`.

### Phase 4.5 R3 — Per-`articleType` card backgrounds

`<NewsCard bg>` lookup: `transfer` → `jersey-deep` / cream text; `interview` / `announcement` / `event` → `cream` / ink text. Consumed by "Verder lezen" at the article footer.

### Phase 0–4 primitives (master plan §4)

`<TapedCard>` + `<TapedFigure>` + `<EditorialHeading>` (accent decorator) + `<MonoLabel>` (full-opacity cream per `feedback_monolabel_cream_full_opacity`) + `<DropCapParagraph>` + `<PullQuote>` + `<EndMark>` + `<StripedSeam>` (no `<SectionTransition type="diagonal">` — see #1701 migration).

### Body width

`--container-prose: 680px` for any long-form article body.

### Inline emphasis in body copy

Portable Text custom decorator only (`feedback_inline_emphasis_via_portable_text`). Never a flat string + separate accent-substring field.

### Hover model

Canonical press-down everywhere (`hover:shadow-none hover:translate-x-1 hover:translate-y-1` + `transition-all duration-300`). No per-component soft-press variants except the EditorialHero homepage `hoverStyle="tilt-photo"` already locked in #1754.

---

## 3. Phasing

```text
5.0   Tracer — `/nieuws/[slug]` route audit + `ARTICLE_BY_SLUG_QUERY` projection extension
        └─ verify `subjects[]`, `firstTransferFact`, `firstEventFact`, body PT blocks ship for all variants
5.A   Interview variant
        ├─ 5.A.d1   Header drill (brief §5 Q1 — centered vs flanked)
        ├─ 5.A.d2   Q&A + pull-quote avatar drill (brief §5 Q2 — photo crop / monogram / illustrated)
        ├─ 5.A.d3   Section-break diamond + Verder-lezen placement sign-off (no design round)
        ├─ 5.A.0    Component scaffolding (`<InterviewHero>`, `<QASection>`, `<QARow>`, `<QASectionDivider>`, `<InterviewCredits>`)
        ├─ 5.A.1    Body composition wiring (`<DropCapParagraph>` + Portable Text body + `<PullQuote>` + `<EndMark>` + Verder-lezen row + Editie footer)
        └─ 5.A.2    `/nieuws/[slug]` page.tsx rewire for `articleType: "interview"`
5.B   Non-interview variants — repeat per variant
        ├─ 5.B.d1   Header drill (per variant, owner-led; each round picks 3–4 visual options)
        ├─ 5.B.d2   Body-flow drill (per variant — confirm what's reused, what's new)
        └─ 5.B.<v>  Implementation per variant (matchverslag / column / transfer / jeugd / evenement / generic)
5.C   Cleanup
        ├─ Old `docs/prd/article-detail-redesign.md` removed
        ├─ Old `article-detail-redesign` milestone closed
        ├─ Legacy `<ArticleHero>` (or equivalent) + per-variant body components retired
        └─ CLAUDE.md "Implemented Routes" + "Redesign primitives" updated
```

Sub-issues spawn as each drill round closes. The PRD does NOT pre-spawn the 5.B sub-tree because variant scope only firms up after each drill.

---

## 4. Component inventory

### New components (interview variant)

- `<InterviewHero>` — title-centered article header with flanking `<TapedFigure>` polaroids + tape-label breadcrumb + green star kicker. **Exact composition gated on brief §5 Q1 drill.**
- `<QASection>` — `<MonoLabel>Q&A</MonoLabel>` heading + alternating `<QARow>` + `<QASectionDivider>`. Width pinned at `--container-prose`.
- `<QARow>` — Freight Display 900 number left · mono speaker tag · `text-display-sm` 600 question · `text-body-md` answer. Optional avatar in the speaker-tag slot **gated on brief §5 Q2 drill.**
- `<QASectionDivider>` — dotted divider between Q&A rows; gains a `flourish="diamond"` variant for section breaks (no design round, owner sign-off only).
- `<InterviewCredits>` — closing credits block (author / interviewees / photographer / publish date).
- `<VerderLezenRow>` — 3-up `<NewsCard>` row at the article footer, inheriting R3 per-`articleType` backgrounds. Same primitive vocabulary as `<NewsGrid>` — `<NewsCard variant="default">` + cream surface.
- `<EditieLabel>` — net-new editorial flourish (UI-only, derived from `publishedAt`: season + sequence count).

### Reused components

- `<TapedCard>`, `<TapedFigure>`, `<TapeStrip>` (Phase 0–4.5)
- `<EditorialHeading>` (Phase 0–1, with accent decorator)
- `<MonoLabel>`, `<MonoLabelRow>` (Phase 0–4.5)
- `<DropCapParagraph>`, `<PullQuote>`, `<EndMark>` (Phase 1)
- `<NewsCard>` (Phase 4.5 R10 flush-edge)
- `<StripedSeam>` (Phase 0 — for article-detail section breaks if any)
- Portable Text renderers + custom `accent` decorator (Phase 4.5 existing)

### Non-interview variants

Each variant's body composition is expected to be **the same shell** (DropCap → PortableText body → optional `<PullQuote>` → `<EndMark>` → `<VerderLezenRow>` → `<EditieLabel>`) **minus `<QASection>`**. Per-variant headers diverge — drill rounds lock each one.

---

## 5. Data layer

### GROQ — `ARTICLE_BY_SLUG_QUERY` audit

The query already returns `titleRich`, `subjects[]`, `firstTransferFact`, `firstEventFact`, and the body PT array. **Audit pass in 5.0:** confirm every field consumed by the new interview components ships through the projection. Likely missing today:

- Q&A speakers + photographer credit. **Open — gate on brief §5 Q2 drill** (avatar source determines whether new schema fields are needed).
- Section-break markers in body PT (whether the article body emits explicit section-break nodes or whether the renderer inserts `<QASectionDivider flourish="diamond">` at heading boundaries).

### Schema migrations

**Zero expected.** Editie line is UI-only. Q&A is rendered from Portable Text body blocks already present on `article.body`. Any net-new field is deferred to a follow-up issue with explicit schema-migration scope.

---

## 6. Analytics

Per `feedback_analytics_prd_requirement` — every new user-facing feature ships events.

### Events to define

- `article_detail_view` (already exists for legacy `/nieuws/[slug]`) — verify parameters cover the new shape: `article_id` (hashed), `article_type`, `article_slug`, `reading_time_estimate`.
- `article_qa_section_in_view` — fires when `<QASection>` scrolls into the viewport for ≥ 250ms.
- `article_pull_quote_in_view` — fires per `<PullQuote>` in-view, with `quote_position` (0-indexed).
- `article_verder_lezen_card_click` — fires on `<VerderLezenRow>` card click, with `target_article_id` (hashed) + `target_article_type` + `source_article_id` (hashed).
- `article_share_click` — if the redesign adds a share affordance (not yet locked — gate on drill).

### GTM / GA4

GTM regex `homepage_|news_|article_` already covers the namespace; verify the new event names match the existing trigger regex pattern. New event parameters need DLV + GA4 Event-tag parameter mapping per `apps/web/CLAUDE.md` Analytics Checklist.

---

## 7. SEO + structured data

- `generateMetadata` already exports OG + canonical for `/nieuws/[slug]`. Audit at 5.A.2 — confirm the new layout doesn't break the existing meta.
- JSON-LD: `Article` schema already emitted via `buildArticleJsonLd`. Audit when subjects + Q&A land — `Article.about` / `Article.mentions` may want to enumerate the interview subjects.
- Sitemap: `/nieuws/[slug]` already in sitemap; no change expected.

---

## 8. Sub-issue tree (proposed)

Spawn at PRD-merge time (only 5.0 + 5.A.d1 + 5.A.d2 are immediately ready):

- **5.0** — `/nieuws/[slug]` tracer + `ARTICLE_BY_SLUG_QUERY` audit (Ralph-ready; no design dependency)
- **5.A.d1** — Header drill (brief §5 Q1)
- **5.A.d2** — Q&A + pull-quote avatar drill (brief §5 Q2)
- **5.A.d3** — Section-break diamond + Verder-lezen placement sign-off (owner-only, no design round)
- **5.A.0** — Component scaffolding (blocked by 5.A.d1 + d2 + d3)
- **5.A.1** — Body composition wiring (blocked by 5.A.0)
- **5.A.2** — `page.tsx` rewire for interview (blocked by 5.A.1)
- **5.B.\*** — per-variant trees spawned after each variant's drill closes
- **5.C** — cleanup (blocked by all 5.A + 5.B)

---

## 9. Open questions

Per the brief §5:

1. **Article header — centered or flanked?** Drill 5.A.d1. Owner direction 2026-05-14 leans centered. Resolve before any interview implementation.
2. **Q&A + pull-quote avatar fill.** Drill 5.A.d2. Three candidates: photo crop / initial monogram / illustrated character vocabulary. Same vocabulary applies to pull-quote attribution.

Pre-resolved at brief level:

- ~~Editie 47 line — UI or schema?~~ **UI-only**, auto-derived from `publishedAt`.

Pre-resolved at PRD level:

- ~~`<QASectionDivider flourish="diamond">` variant.~~ **Approve at owner sign-off — no drill needed.**

---

## 10. Discovered unknowns

_Empty at PRD authoring time. Append entries here when implementation surfaces something unexpected._

```text
[YYYY-MM-DD] Description of unknown surfaced during implementation. Disposition: resolved in-PR / spun out as #NNNN / deferred to Phase X.
```
