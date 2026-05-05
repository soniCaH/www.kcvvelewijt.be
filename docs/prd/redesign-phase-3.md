# Redesign — Phase 3: Tier C figures + EditorialHero + Layout chrome

> **Master design reference:** `docs/plans/2026-04-27-redesign-master-design.md`
> **Design brief:** `docs/plans/2026-05-03-redesign-phase-3-design.md` (Checkpoints A · B · C · D — all locked 2026-05-04 / 2026-05-05)
> **Tracking issue:** [#1525](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1525)
> **Implementation plan:** `docs/plans/2026-05-03-redesign-phase-3-plan.md` _(to be authored after this PRD)_
> **Milestone:** `redesign-retro-terrace-fanzine`
> **Epic:** KCVV Elewijt redesign — retro-terrace fanzine aesthetic
> **Predecessor:** [#1524](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1524) — Phase 2 (atom rework + Phosphor swap)
> **Blocks:** Phase 4 (homepage rebuild), Phase 5 (article-detail pages), every later phase
> **Owner:** _you_
> **Estimate:** ~3 weeks (1 week design exploration ✅ done · 1.5 weeks implementation · 0.5 week migration / cleanup, parallelisable)

---

## 1. Problem statement

Phase 2 closed the atom-level visual fork by reskinning every atom to the cream/ink/jersey vocabulary. Phase 3 builds the **composition** layer on top of those atoms: the page-level surfaces every Phase 4+ page will compose with.

Three problems are open today:

1. **No editorial hero exists.** Every detail page (article, event, transfer, interview) currently renders a generic `<PageHero>` with no support for variant-specific composition (no per-articleType chrome, no factStrips, no Q&A divider). The redesign demands an `<EditorialHero>` with a discriminated union over 4 article-type variants, plus a homepage placement extension.
2. **Tier C illustrative primitives are missing.** Master design §4.4 catalogues four primitives (`<PlayerFigure>`, `<JerseyShirt>`, `<EndMark>`, `<QASectionDivider>`) that don't exist in the design system. Phase 4+ surfaces (player profiles, interviews) can't compose without them.
3. **Site-wide chrome (header / matchstrip / footer) is on legacy aesthetics.** `PageHeader.tsx`, `MatchStripClient.tsx`, and `PageFooter.tsx` predate the redesign and use the bright-green-pill / Lucide-icon vocabulary that Phase 2 already retired on atoms. The chrome is the most-visible surface on the site (every page); leaving it on legacy aesthetic blocks every future page from feeling visually coherent.

Without Phase 3, no Phase 4+ page can ship visually coherent — the chrome above and the figures within remain mismatched against the editorial body.

---

## 2. Scope

**Packages touched:** `apps/web` (primary). `packages/sanity-schemas` (for the 5 blocking schema migrations).

**In scope:**

- **Tier C figures** (4 primitives): `<PlayerFigure>` · `<JerseyShirt>` · `<EndMark>` · `<QASectionDivider>`. Each ships with Storybook + VR coverage.
- **`<EditorialHero>`** with discriminated union over 4 article-type variants (`announcement` · `transfer` · `event` · `interview`) + homepage placement extension (`placement="detail" | "homepage"`).
- **Layout chrome rework**:
  - `<SiteHeader>` rework (replaces legacy `<PageHeader>` for redesign-mounted pages).
  - `<MatchStrip>` rework (renames + restyles legacy `<MatchStripClient>`).
  - `<SiteFooter>` rework (replaces legacy `<PageFooter>`).
- **`<PageHero>` retirement** — call-site migration from `<PageHero>` to `<EditorialHero variant=…>`.
- **5 blocking Sanity schema migrations** (Checkpoint B).
- **3 founding-year fixes** (one-line corrections in `MissionBanner` · `PageHeader` wordmark · `jsonld.ts`).

**Explicitly OUT of scope:**

- **Homepage rebuild** (Phase 4). The `placement="homepage"` extension on `<EditorialHero>` ships in Phase 3 so Phase 4 can consume it without re-drilling the design.
- **Article detail body redesign** (Phase 5). Phase 3 ships only the hero + factStrips; the body components (DropCapParagraph, articleImage, videoBlock, fileAttachment, htmlTable, qaBlock, etc.) keep their existing rendering until Phase 5.
- **Player profiles** (Phase 6). The `articleType=player` variant of `<EditorialHero>` was specced and dropped — player gets its own `<PlayerHero>` in Phase 6 (per master design line 539).
- **`articleType=matchPreview` / `matchRecap`** — those articleTypes don't exist yet in the schema; deferred to issue #1470 which adds them. The `<EditorialHero>` discriminated union is designed to accept them later without re-drilling.
- **Sanity siteSettings document** — header nav, footer nav, motto, address, social URLs all stay hard-coded in code constants. A future Studio UX rework (`project_sanity_studio_ux_rework`) may surface a CMS-editable site settings document; that's not Phase 3.
- **MatchStrip live state / concluded state / ticketing CTA** — owner-confirmed permanently out of scope (no live data feed, no ticketing). The strip is forward-looking only. State matrix is `hidden / upcoming`.
- **Newsletter signup** — KCVV doesn't run one and won't (per `feedback_no_newsletter`).
- **`<PosterWordmark>` band** — referenced in master design §5.1 step 11 but never shipped; the locked SiteFooter's H3 wordmark replaces its role.

---

## 3. Tracer bullet

The thinnest cross-layer slice that proves the Phase 3 architecture works:

> **Land `<EndMark>` primitive + Storybook story + VR baseline.**
>
> Demonstrated by: `<EndMark>` exported from `apps/web/src/components/design-system/EndMark/`, with `EndMark.stories.tsx` (`UI/EndMark`, `vr` tag, default story showing `[1px ink rule] ★ EINDE GESPREK ★ [1px ink rule]`), VR baseline captured, `pnpm --filter @kcvv/web check-all` green.

`<EndMark>` is the right tracer because (a) it's atomic (no sub-component dependencies), (b) it's locked to a single visual treatment in `endmark-locked.md`, and (c) it touches every Phase 3 sub-system (design-system folder, Storybook, VR baseline) without depending on the bigger compositions.

If the tracer fails, every Phase 3 sub-issue is at risk. If it passes, the four tracks below can fan out.

---

## 4. Sub-issues — 11 children of #1525

```text
3.0  — Tracer bullet · <EndMark> primitive shipped end-to-end
   ↓
   ├── 3.A — Tier C figures track (parallel after 3.0)
   │     3.A.1  <PlayerFigure>
   │     3.A.2  <JerseyShirt>
   │     3.A.3  <EndMark>          ← tracer; just ensure Storybook polish + final VR
   │     3.A.4  <QASectionDivider>
   │
   ├── 3.B — Composition track (serial)
   │     3.B.1  <EditorialHero> shell + discriminated union types (no variants)
   │     3.B.2  <EditorialHero> variants ← depends on 3.A.1 + 3.A.2 + 3.B.1
   │     3.B.3  <PageHero> retirement + call-site migration ← depends on 3.B.2
   │
   └── 3.C — Layout track (parallel after the relevant locks)
         3.C.1  <SiteHeader> rework (icon + drawer + sticky behaviour)
         3.C.2  <MatchStrip> rework (landing-only render, 2-state matrix)
         3.C.3  <SiteFooter> rework (H3 + I2 + role-based items)
```

**Dependency edges (`addBlockedBy` GraphQL mutations):**

- `3.B.2` blocked by `3.A.1` + `3.A.2` + `3.B.1`
- `3.B.3` blocked by `3.B.2`
- All 11 children blocked by `3.0` (tracer must pass first)
- `3.C.*` parallel after their respective design lock + tracer

---

## 5. Acceptance criteria per sub-issue

### 5.0 Tracer (`<EndMark>` end-to-end)

- `<EndMark>` exported from design-system barrel.
- Composition matches `endmark-locked.md`: `[1px ink rule] · ★ EINDE GESPREK ★ · [1px ink rule]`. Glyphs are flex children, not pseudo-elements. Three-centerline alignment contract documented in component file.
- `EndMark.stories.tsx` with title `UI/EndMark`, `vr` tag, default story.
- VR baseline captured.
- `pnpm --filter @kcvv/web check-all` green.

### 5.A — Tier C figures (per locked spec)

| Sub-issue | Spec                         | New schema?                                                                                                                                                 |
| --------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.A.1     | `playerfigure-locked.md`     | No                                                                                                                                                          |
| 3.A.2     | `jerseyshirt-locked.md`      | No                                                                                                                                                          |
| 3.A.3     | `endmark-locked.md`          | No                                                                                                                                                          |
| 3.A.4     | `qasectiondivider-locked.md` | Yes — adds `packages/sanity-schemas/src/blocks/qaSectionDivider.ts` (constrained PT title with Accent decorator + optional kicker), wired into article body |

Each sub-issue ships:

- The component matching the locked spec verbatim.
- Storybook story under `UI/<Name>`, `vr` tag.
- VR baseline.
- Reuse mandate audit (existing primitives consumed; only the new component itself is new).

### 5.B — `<EditorialHero>` composition

#### 5.B.1 Shell + discriminated union (no variants)

- `<EditorialHero>` exported from `apps/web/src/components/article/`.
- Discriminated union over `variant: "announcement" | "transfer" | "event" | "interview"` (4 today; designed to accept `matchPreview` / `matchRecap` from #1470 later).
- `placement?: "detail" | "homepage"` (default `"detail"`).
- New shared sub-components extracted (each with Storybook coverage):
  - `<EditorialHeroShell>` — 60/40 grid + ink rule.
  - `<EditorialKicker>` — star sandwich + dot-separated MonoLabel row.
  - `<EditorialLead>` — italic display paragraph, max-width 52ch + truncate-to-280 helper.
  - `<EditorialByline>` — author row with leading star.
  - **Cover image artefact** — direct composition `<TapedCard rotation>` + `<TapedFigure aspect="landscape-16-9">` inline in each variant component. **No new wrapper primitive** (existing `<TapedFigure>` already accepts the 16:9 aspect).
- 0 variant rendering — variants land in 3.B.2.

#### 5.B.2 Variants (depends on 3.A.1 + 3.A.2 + 3.B.1)

Per-variant locked spec:

| Sub-issue | Variant      | Spec                     | Per-variant artefact                          |
| --------- | ------------ | ------------------------ | --------------------------------------------- |
| 3.B.2     | announcement | `announcement-locked.md` | Cover image (right column)                    |
|           | transfer     | `transfer-locked.md`     | TransferFactStrip below hero                  |
|           | event        | `event-locked.md`        | EventFactStrip below hero                     |
|           | interview    | `interview-locked.md`    | SubjectsStrip + Q&A divider + EndMark in body |

Plus the homepage placement extension folded into all 4 specs:

- `placement="homepage"` wraps the hero in `<a href={`/nieuws/${article.slug}`}>`.
- Press-up hover (`translate(-2px, -2px)` + grown shadow) + `★ Lees verder →` hint fade-in on hover.
- Body content (factStrips, Q&A, EndMark) does not render in homepage placement.

5 blocking schema migrations land alongside this sub-issue (see §7).

#### 5.B.3 `<PageHero>` retirement + call-site migration (depends on 3.B.2)

- Every existing `<PageHero>` call site migrates to `<EditorialHero variant=…>`.
- Legacy `<PageHero>` removed from design-system barrel.
- No regression on existing detail pages (manual smoke + VR pass).

### 5.C — Layout chrome

#### 5.C.1 `<SiteHeader>` (per `header-locked.md`)

- Sticky at `top: 0` on every page (Q1 B1 lock).
- Icon-only search → `/zoeken` (Q2 C1).
- WORD LID hidden on mobile; full `KCVV Elewijt` wordmark with jersey-deep accent on `Elewijt` preserved (Q3 D3).
- Mobile drawer: full-screen takeover, Playfair italic 22px nav, `▾` only on submenu items, Word lid as hero block (Q4 E2 refined).
- New shared sub-components: `<NavTakeover>`, `<NavTakeover.Item>`. Each Storybook-covered. Icon-only buttons (search, hamburger, drawer ✕) reuse `<Button variant="ghost" size="sm">` with Phosphor icon children — no new `<IconButton>` primitive.
- Replaces legacy `<PageHeader>` site-wide (root layout swap).
- **Founding year `SINDS 1948` in wordmark superscript → `SINDS 1909`** in passing.

#### 5.C.2 `<MatchStrip>` (per `matchstrip-locked.md`)

- 2-state matrix: hidden (`null`) / upcoming. No live, no concluded, no ticketing CTA (owner-confirmed scope).
- Rendered on **landing surfaces only** (homepage + section indexes); detail pages, single-team / single-player / single-match detail, hero-less utility pages omit the slot (Q5 G3 lock).
- New shared sub-component: `<ShieldFigure>` (heraldic clip-path + variants `kcvv` / `opponent`).
- Renames legacy `<MatchStripClient>` → `<MatchStrip>`. Same BFF data source (`/matches/next`); no schema or API changes.

#### 5.C.3 `<SiteFooter>` (per `footer-locked.md`)

- H3 vocabulary: cream paper · modest 44px wordmark + 2-colour motto · 3-col directory · ink bottom bar.
- I2 task-oriented columns: Ontdek · Aansluiten · Bij de club.
- J1 refined middle column: role-based items (Als speler · Als vrijwilliger · Als sponsor).
- Founding year `1909` in `© 1909–2026 KCVV Elewijt` colofon. **Three buggy code locations corrected in passing**: `MissionBanner` (was 1948) · `PageHeader` wordmark superscript (handled by 3.C.1) · `jsonld.ts` (was 1924).
- Footer directory links reuse `<EditorialLink variant="inline" tone="light">` — no new `<FooterLink>` primitive. The existing inline + light combo provides ink-soft default + jersey-deep hover (with `<HighlighterStroke>` sweep) at the right density for footer columns.
- Reuses existing `<EditorialHeading>`, `<MonoLabel>`, `<SocialLinks>`, `<CookiePreferencesButton>` verbatim.
- Replaces legacy `<PageFooter>` site-wide (root layout swap).

### Cross-cutting acceptance

- Every new shared sub-component ships with `<Name>.stories.tsx` (title `UI/<Name>`, `vr` tag, VR baseline) per the redesign Storybook mandate.
- No regressions on existing pages: VR full-suite green after 3.B.3 migration lands.
- No fabricated data — every rendered field traces to a real source (audit-confirmed in each `*-locked.md`'s field-source map).
- Master design §4.4 / §5.1 deltas captured in this PRD's §6 are reflected back into the master design doc as part of 3.0 wrap-up.

---

## 6. Master design deltas (consolidated)

The Phase 3 locks revise five sections of `docs/plans/2026-04-27-redesign-master-design.md`. Fold these into the master design doc when 3.0 ships:

1. **§4.4 catalogue — `<PlayerFigure>` spec.** Replace "illustrated jersey + arms with photo-fillable circular face" with: "two mutually-exclusive states picked at runtime by `psdImage` availability — **Photo**: rectangular `psdImage` in a polaroid TapedCard frame, no surrounding illustration. **Illustration**: canonical block-print figure (jersey-deep underprint + ink overprint, ellipse head, V-collar, 4 vertical stripes), shared across all options."
2. **§4.4 catalogue — `<JerseyShirt>` spec.** Replace "stylised jersey thumbnail" with: "single decorative jersey illustration sharing PlayerFigure's two-pass vocabulary (palette inverted — ink underprint + jersey-deep overprint). YouthBlock only."
3. **§5.1 step 9 (WebshopStrip).** Drop `<JerseyShirt>` as the primitive. Webshop conversion needs real product photography — use `<TapedCard>` + `<img>` + price + CTA composition instead.
4. **§5.1 step 11 — `<PosterWordmark>` band.** Remove the band entirely. The locked SiteFooter's H3 wordmark replaces its role.
5. **§5.2 interview template.** Drop `flourish: "em-dash" | "star"` from `<EndMark>` and `<QASectionDivider>` props. Each component has a single fixed glyph: `★` for EndMark, `✦` for QASectionDivider.
6. **§5.3 player profile.** `<PlayerFigure>` no longer contains `<TicketStub>` internally. The hero composition can place `<TicketStub>` as a sibling next to `<PlayerFigure>` if the page wants it.

These deltas are descriptive, not destructive — the master design stays as the historical record of phase-0 thinking; this PRD overrides the relevant sections.

---

## 7. Sanity schema deltas (BLOCKING for 3.B.2)

Per `docs/design/mockups/phase-3-b-editorial-hero/fields.md`. All five must land before or alongside the 3.B.2 implementation. Each migration ships in `packages/sanity-schemas/src/` with a paired `migrations/*.ts` script and a documented "run before deploy" step in 3.B.2's PR description.

| #   | Schema change                                                                                          | Pre-deploy migration                                | Notes                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `article.lead` field added                                                                             | None — new optional field                           | Falls back to `firstParagraphOf(body, 280)` when undefined                                                                      |
| 2   | `articleType=event` body validator: ≥1 `eventFact` required                                            | Audit existing event articles; backfill if needed   | Validator added to `article` schema's `body` of type with conditional rule                                                      |
| 3   | `articleType=transfer` body validator: ≥1 `transferFact` required                                      | Audit existing transfer articles; backfill          | Same pattern                                                                                                                    |
| 4   | `article.coverImage` becomes required (`r.required()`)                                                 | **Pre-deploy dataset audit + backfill required**    | Dataset query identifies articles missing `coverImage`; editorial team fills                                                    |
| 5   | `article.title` → constrained Portable Text + `accent` decorator (single block, no other marks/styles) | One-shot data migration string→PT for every article | Every consumer (cards, hero, OG meta, JSON-LD, sitemap, search, RSS) updates to PT-aware rendering or `serializeTitle()` helper |

Plus one Checkpoint A schema addition (non-blocking for 3.B.2 but lands in 3.A.4):

- `packages/sanity-schemas/src/blocks/qaSectionDivider.ts` — single-block PT `title` (Accent decorator only) + optional `kicker` string. Added to article `body`'s `block.of[]`.

Plus one non-blocking Checkpoint B follow-up:

- Optional `article.author` field (not required; default rendered byline stays `"Door redactie"` until that field ships).

**Checkpoints C and D require zero schema migrations.** All header / matchstrip / footer data lives in static literals + existing constants + the existing `UpcomingMatch` shape from `/matches/next`.

---

## 8. New shared sub-components — Storybook required

Every new shared sub-component shipped in Phase 3 carries a Storybook story (`<Name>.stories.tsx`, title `UI/<Name>`, `vr` tag) and a VR baseline. Per the redesign mandate.

**Reuse audit (2026-05-05):** the claims below survived a check against the existing design-system barrel. Three earlier candidates (`<IconButton>`, `<FooterLink>`, `<HeroCoverImage>`) were dropped — existing primitives cover those use-cases (see §8b below).

| Sub-issue | Component              | Notes                                                                                                                                                                                                                                      |
| --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3.A.1     | `<PlayerFigure>`       | Primitive — photo state (polaroid TapedCard) + illustration state (block-print figure)                                                                                                                                                     |
| 3.A.2     | `<JerseyShirt>`        | Primitive — single decorative jersey illustration (inverted palette)                                                                                                                                                                       |
| 3.A.3     | `<EndMark>`            | Primitive — `[rule] ★ EINDE GESPREK ★ [rule]`                                                                                                                                                                                              |
| 3.A.4     | `<QASectionDivider>`   | Primitive — single block PT title + ✦ glyph                                                                                                                                                                                                |
| 3.B.1     | `<EditorialHeroShell>` | Shared — 60/40 grid + ink rule                                                                                                                                                                                                             |
| 3.B.1     | `<EditorialKicker>`    | Shared — thin wrapper around `<MonoLabelRow divider="★">` + leading/trailing ★ glyphs                                                                                                                                                      |
| 3.B.1     | `<EditorialLead>`      | Shared — italic display paragraph + truncate-to-280 helper                                                                                                                                                                                 |
| 3.B.1     | `<EditorialByline>`    | Shared — author row with leading star                                                                                                                                                                                                      |
| 3.B.2     | `<TransferFactStrip>`  | Variant artefact — 3 paper cards + jersey-deep arrows for incoming                                                                                                                                                                         |
| 3.B.2     | `<EventFactStrip>`     | Variant artefact — ticket-stub banner with jersey-deep date block                                                                                                                                                                          |
| 3.B.2     | `<SubjectsStrip>`      | Variant artefact — N=1/2/3/4 polaroid layouts + mobile compact list                                                                                                                                                                        |
| 3.C.1     | `<NavTakeover>`        | New primitive — full-viewport mobile drawer surface                                                                                                                                                                                        |
| 3.C.1     | `<NavTakeover.Item>`   | New primitive — drawer nav row (Playfair italic 22px + paper-edge rule)                                                                                                                                                                    |
| 3.C.2     | `<ShieldFigure>`       | New primitive — heraldic clip-path shield with `kcvv` / `opponent` variants. **Caveat:** partial geometry overlap with `<StampBadge>` — flag for post-Phase-3 unification (clip-path swap could potentially fold both into one primitive). |

### 8b · Existing primitives reused (no new component)

| Use-case                                             | Existing primitive                                                                   | How                                                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header search · hamburger · drawer ✕ icon affordance | `<Button variant="ghost" size="sm">` + Phosphor icon child                           | Ghost variant already provides 1.5px ink stroke + sharp corners + canonical press-down hover. **No new `<IconButton>` needed.**                   |
| Footer directory link                                | `<EditorialLink variant="inline" tone="light">`                                      | Existing inline + light combo serves the ink-soft default + jersey-deep hover with `<HighlighterStroke>` sweep. **No new `<FooterLink>` needed.** |
| EditorialHero cover image artefact                   | Direct composition: `<TapedCard rotation>` + `<TapedFigure aspect="landscape-16-9">` | `<TapedFigure>` already accepts `aspect="landscape-16-9"`. Inline composition in the variant components — **no `<HeroCoverImage>` wrapper.**      |
| MatchStrip CTA                                       | `<Button variant="primary" size="sm">`                                               | Existing primary variant + small size                                                                                                             |
| Footer wordmark                                      | `<EditorialHeading>`                                                                 | At 44px (vs header's 26px); jersey-deep accent on `Elewijt`                                                                                       |
| Footer column headings                               | `<MonoLabel>` size `sm` weight 700                                                   | With custom 1.5px jersey-deep underline (one-off footer styling, not new primitive)                                                               |
| EditorialKicker MonoLabel row                        | `<MonoLabelRow divider="★">`                                                         | Existing component already accepts `divider` prop with `"★"` option                                                                               |
| Match shield team name                               | `<EditorialHeading>`                                                                 | At 16px display italic 700; same primitive as wordmark, scaled down                                                                               |
| Footer social glyphs                                 | `<SocialLinks>`                                                                      | Reuses existing component; ink-bar styling override (1px cream outline)                                                                           |
| Footer cookie consent                                | `<CookiePreferencesButton>`                                                          | Reused as-is; no API change                                                                                                                       |

---

## 9. Mockup references

Every visual decision in this PRD traces to a locked mockup file. The drill-down records (`compare.md`, `option-a-*-comparisons.html`) preserve the journey for future audit.

| Surface                            | Locked spec                                            | Canonical detail mockup                                           | Drill-down record (with archives)                                       |
| ---------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `<PlayerFigure>`                   | `phase-3-a-tier-c-figures/playerfigure-locked.md`      | (see locked spec for screenshot refs)                             | `phase-3-a-tier-c-figures/compare.md`                                   |
| `<JerseyShirt>`                    | `phase-3-a-tier-c-figures/jerseyshirt-locked.md`       | (see locked spec for screenshot refs)                             | same                                                                    |
| `<EndMark>`                        | `phase-3-a-tier-c-figures/endmark-locked.md`           | (see locked spec for screenshot refs)                             | same                                                                    |
| `<QASectionDivider>`               | `phase-3-a-tier-c-figures/qasectiondivider-locked.md`  | (see locked spec for screenshot refs)                             | same                                                                    |
| EditorialHero · announcement       | `phase-3-b-editorial-hero/announcement-locked.md`      | `phase-3-b-editorial-hero/option-a-announcement-detail.html`      | `option-a-announcement-comparisons.html` (n/a — no comparisons phase)   |
| EditorialHero · transfer           | `phase-3-b-editorial-hero/transfer-locked.md`          | `phase-3-b-editorial-hero/option-a-transfer-detail.html`          | `option-a-transfer-comparisons.html` (where applicable)                 |
| EditorialHero · event              | `phase-3-b-editorial-hero/event-locked.md`             | `phase-3-b-editorial-hero/option-a-event-detail.html`             | `option-a-event-comparisons.html`                                       |
| EditorialHero · interview          | `phase-3-b-editorial-hero/interview-locked.md`         | `phase-3-b-editorial-hero/option-a-interview-detail.html`         | `option-a-interview-comparisons.html`                                   |
| EditorialHero · homepage placement | (folded into all 4 \*-locked.md above)                 | (locked example in comparisons file)                              | `phase-3-b-editorial-hero/option-a-homepage-placement-comparisons.html` |
| `<SiteHeader>`                     | `phase-3-c-header-and-matchstrip/header-locked.md`     | `phase-3-c-header-and-matchstrip/option-a-header-detail.html`     | `option-a-header-comparisons.html`                                      |
| `<MatchStrip>`                     | `phase-3-c-header-and-matchstrip/matchstrip-locked.md` | `phase-3-c-header-and-matchstrip/option-a-matchstrip-detail.html` | (same comparisons file as header)                                       |
| `<SiteFooter>`                     | `phase-3-d-footer/footer-locked.md`                    | `phase-3-d-footer/option-x-footer-detail.html`                    | `phase-3-d-footer/option-x-footer-comparisons.html`                     |

---

## 10. Visual regression baseline strategy

Phase 2 shipped `pnpm vr:update:story <pattern>` for targeted baseline updates. Phase 3 uses it heavily.

**Baseline plan:**

- Every new sub-component (per §8 above) gets a fresh VR baseline at sub-issue ship time.
- `<EditorialHero>` variants — one VR story per variant per placement (4 variants × 2 placements = 8 baselines), plus mobile breakpoint (`vr.viewport: "mobile"`).
- `<MatchStrip>` — one VR story for the upcoming state (only rendered state); the hidden state has zero DOM and is verified by integration test, not VR.
- `<SiteHeader>` mobile drawer — one VR story per drawer state (closed default + open default + open with one submenu expanded).
- Existing pages that consume new chrome — full-suite VR run after 3.B.3 (PageHero retirement) lands. Any regression is investigated before merge.

**`vr.disable` candidates** (carry the disable tag, not a baseline):

- Animation states (drawer slide-in, press-down hover) — use `vr.disable` because animation timing is non-deterministic.
- Hover-only states (homepage placement press-up + hint) — use `vr.hover` story variant if hover capture is needed; otherwise `vr.disable`.

VR baseline cost estimate: ~41 minutes wall time for the full Phase 2+3 set (per `reference_vr_update_walltime.md`); run in background with tightened Monitor filters.

---

## 11. Open follow-ups (non-blocking)

These are surfaced in this PRD so the implementation plan can reference them without surprise during 3.B.2 / 3.C.\* work:

### Code corrections (one-line fixes during 3.C.\* implementation)

- **Founding year**: `MissionBanner` (1948 → 1909) · `PageHeader` wordmark superscript (1948 → 1909, handled by 3.C.1) · `jsonld.ts` `foundingDate` (1924 → 1909). All three corrected in passing, captured per `reference_club_founding_year.md`.
- **`<PageFooter>` legacy `clubLinks`** route audit — locked footer's link list (`/club/inschrijven` · `/club/word-vrijwilliger` · `/sponsors` · etc.) needs route reconciliation against current production routes during 3.C.3 implementation. Some current `clubLinks` routes (`/kalender`, `/ploegen`, `/bestuur`) need verification.
- **Webshop link** — currently in `clubLinks` and `EXTERNAL_LINKS.webshop`. Locked footer omits it. Decision: webshop is an external destination; doesn't earn a footer slot. If owner wants a webshop CTA, add to the header's CTA-row context (future top-bar promo).

### Schema-deferred follow-ups

- **`article.author` field** (Checkpoint B Ask 2) — optional override; defaults to `"Door redactie"` until the field ships. Not blocking; can land any time.
- **`article.coverImageCaption` field** — discussed during announcement variant lock; default decision is to drop the caption row entirely. Revisit if editorial requests.

### Implementation-time decisions

- **Production search glyph** — mockups use typographic `⌕`; production swaps to Phosphor `MagnifyingGlass` (or equivalent). Decide during 3.C.1.
- **Initial-extraction logic for opponent shield placeholder** — when `match.away_team.logo` is undefined, what initial does `<ShieldFigure variant="opponent">` render? First letter of last word? First letter of first word? Decide during 3.C.2.
- **Sub-item lazy reveal in `<NavTakeover>`** — drawer submenu sub-items render lazily (not in initial DOM) to keep the closed list short on small phones. Implementation detail in 3.C.1.

### Memories captured during the drill (apply to all future surfaces)

- `feedback_no_decorative_nav_ornaments.md` — only functional indicators (`▾` submenu, `↗` external) belong in nav-item right slots.
- `feedback_no_newsletter.md` — KCVV doesn't run one and won't.
- `feedback_drill_visual_then_ia.md` — voice → IA → details; placeholder data in voice-stage mockups is expected.
- `feedback_role_based_engagement_naming.md` — heading carries the verb; items name roles ("Als speler / Als vrijwilliger / Als sponsor", not "Word X · Word X · Word X").
- `feedback_editorial_hero_drill_pattern.md` — iterative drill-down workflow; updated to "screenshots only at lock points, not per-question".
- `reference_club_founding_year.md` — 1909 canonical.

---

## 12. Discovered unknowns

Surfaces that may need a follow-up phase or RFC:

- **Section-index landing pages** (`/nieuws`, `/evenementen`, `/teams`, `/jeugd`, `/sponsors`) currently have varying levels of design polish. The MatchStrip Q5 G3 lock declares these as "landing surfaces" that render the strip — but their headers, hero modules, and footer compositions are touched by Phase 3 chrome but not redesigned. They're effectively part of the Phase 4 homepage rebuild scope; this PRD's chrome ships will visibly upgrade them, but their content modules stay untouched.
- **Hero-less utility pages** (`/zoeken`, `/sitemap`, error pages) — Phase 3 chrome ships on them too. Their body content is unchanged; only header + footer swap to the new vocabulary. Acceptable as-is.
- **`articleType=matchPreview` / `matchRecap`** — issue #1470 will add these articleTypes. The `<EditorialHero>` discriminated union accepts them; the per-variant artefact composition is deferred to that issue's design phase.

---

## 13. Estimate

| Track                                                    | Estimate        |
| -------------------------------------------------------- | --------------- |
| 3.0 Tracer (`<EndMark>` end-to-end)                      | 0.5 day         |
| 3.A — Tier C figures (4 sub-issues, parallel)            | 3–4 days total  |
| 3.B.1 — `<EditorialHero>` shell                          | 1.5 days        |
| 3.B.2 — `<EditorialHero>` variants + 5 schema migrations | 3–4 days        |
| 3.B.3 — `<PageHero>` retirement + call-site migration    | 1 day           |
| 3.C.1 — `<SiteHeader>` rework                            | 2 days          |
| 3.C.2 — `<MatchStrip>` rework                            | 1 day           |
| 3.C.3 — `<SiteFooter>` rework                            | 1 day           |
| Founding year fixes + miscellaneous cleanup              | 0.5 day         |
| VR baseline runs + check-all green                       | 0.5–1 day       |
| **Total**                                                | **~14–17 days** |

---

## 14. Exit criteria

Phase 3 is done when:

- All 11 sub-issues closed (3.0 + 3.A.{1-4} + 3.B.{1-3} + 3.C.{1-3}).
- Every Tier C primitive ships with Storybook + VR baseline.
- `<EditorialHero>` renders all 4 variants (announcement / transfer / event / interview) at both placements (detail / homepage).
- `<PageHero>` removed from the codebase. No legacy call sites remain.
- `<SiteHeader>` / `<MatchStrip>` / `<SiteFooter>` site-wide swap complete; legacy `<PageHeader>` / `<MatchStripClient>` / `<PageFooter>` removed.
- Founding year `1909` everywhere (3 buggy locations corrected).
- 5 Sanity schema migrations executed on staging + production.
- `pnpm --filter @kcvv/web check-all` green.
- VR full-suite green; any regression investigated and explicitly approved.
- This PRD's §6 deltas reflected back into `docs/plans/2026-04-27-redesign-master-design.md`.
