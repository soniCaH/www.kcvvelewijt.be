---
name: Article detail redesign — content-type-aware templates
description: PRD for reworking /nieuws/[slug] into four content-type-aware templates (interview, announcement, transfer, event) with structured Sanity blocks
status: draft — ready for /prd-to-issues
design_source: docs/plans/2026-04-19-article-detail-redesign-design.md
---

# Article detail redesign — PRD

Design contract: [`docs/plans/2026-04-19-article-detail-redesign-design.md`](../plans/2026-04-19-article-detail-redesign-design.md). This PRD translates it into shippable phases.

---

## 1. Problem statement

Today's `/nieuws/[slug]` renders every article type — interviews, announcements, transfer news, events — through a single generic Portable Text template. Interviews suffer most: editors hand-format Q&A with bold questions and italic em-dash answers, producing a flat wall of paragraphs that reads as "ywannnnn" (direct user quote from the brainstorm). Transfer news is a prose paragraph that buries the actual _who moved where_; event news scatters date/venue/CTA inside body copy. Visually, every article looks identical regardless of content, which drains editorial energy at exactly the moments the club wants to hype (new signings, interviews, tournaments). This work introduces `articleType`-driven templates plus structured body blocks (`qaBlock`, `transferFact`, `eventFact`) so structure encodes meaning and the template owns the rhythm.

## 2. Scope

### Packages touched

- **`packages/sanity-schemas`** — five new schema types (`articleType` enum on `article`, `subject` object, `qaBlock` + `qaPair`, `transferFact`, `eventFact`). Body array extended.
- **`apps/web`** — new template components, PortableText custom renderers for the three new block types, per-type hero variants, redesigned metadata bar, restyled related slider, drop-cap and blockquote rework, scroll fade-up motion, `subject`-driven attribution, JSON-LD builders, analytics events.
- **`apps/studio/` + `apps/studio-staging/`** — pick up schema changes automatically via the shared `@kcvv/sanity-schemas` package. No per-studio edits unless we add custom Studio previews in a later phase (Phase 7 — tentative).

### Out of scope (explicit)

- `/nieuws` listing page redesign (card layouts, filter chips). Listings keep consuming `article.coverImage` at 16:10 — zero breakage.
- Homepage featured-article carousel restyle. Same card source; no visual change.
- Restyling non-article cards inside `RelatedContentSlider` (player, staff, team cards). Only the article-card treatment changes.
- `apps/api` BFF changes. Articles come from Sanity directly via the web repository layer; the BFF is not involved.
- `packages/api-contract` changes. Article data is Sanity-native; no normalized schemas needed.
- Studio UX / DX rework beyond basic field wiring. The dedicated editor-UX rework is tracked separately per the `project_sanity_studio_ux_rework` memory.
- Automatic content-aware migration of legacy articles beyond backfilling `articleType='announcement'`. Editors re-tag and restructure legacy interviews manually over time.

## 3. Tracer bullet

**"A single article with `articleType='interview'` renders at `/nieuws/[slug]` through a dedicated `InterviewTemplate`, and its body contains one `qaBlock` with two `standard`-tagged pairs that render with the Q&A template (numbered pair, 4rem gutter, 1px rule)."**

What this proves end-to-end:

- Schema change lands in `packages/sanity-schemas` and is picked up by both studios (dual-studio rule).
- A Sanity document can carry the new `qaBlock` array-of-pairs body block.
- The web GROQ query returns the new block shape.
- The PortableText renderer in `apps/web` dispatches to a custom component for `qaBlock`.
- The page route reads `articleType` and swaps template at render time (fallback = existing treatment).
- Nothing about existing legacy articles breaks — they still render through the default path.

No styling polish on anything else, no other article types, no `key`/`quote`/`rapid-fire` treatments, no subject autofill, no analytics, no migration yet. **One article, one type, one tag.**

## 4. Phases

Each phase is one deployable unit. Tests pass, no broken state, mergeable independently.

```text
Phase 1 — #1327  Tracer bullet — articleType dispatch + qaBlock standard rendering
Phase 2 — #1328  qaBlock full tag suite (key, quote, rapid-fire) + subject schema + SubjectAttribution
Phase 3 — #1329  Interview template polish — hero (4:5 portrait), metadata bar, related slider integration
Phase 4 — #1330  Announcement template — drop-cap, rule-framed blockquote, body fade-up motion
Phase 5 — #1331  Transfer template + transferFact block (feature + overview variants)
Phase 6 — #1332  Event template + eventFact block (feature + overview variants)
Phase 7 — #1333  Related slider restyle (article-card treatment only) + JSON-LD + analytics
Phase 8 — #1334  Migration — backfill articleType on legacy articles, editorial re-tagging guide
```

**Milestone:** [`article-detail-redesign`](https://github.com/soniCaH/www.kcvvelewijt.be/milestone/37)

Rollout posture: phases 2–7 can ship in any order relative to each other once Phase 1 lands, but the order above minimises re-work (subject + qaBlock tags before interview hero; templates before their structured blocks; analytics last so it covers final event taxonomy).

## 5. Acceptance criteria per phase

### Phase 1 — #1327 — Tracer bullet

- [ ] `packages/sanity-schemas/src/article.ts` has `articleType` string field with enum `interview | announcement | transfer | event`, radio layout, required, default `announcement`.
- [ ] New files: `packages/sanity-schemas/src/qaBlock.ts` (exports `qaBlock` + `qaPair`). `qaPair` has `question: string (max 240)`, `answer: array of block`, `tag: string` (default `standard`).
- [ ] Schema barrel `packages/sanity-schemas/src/index.ts` re-exports the new types.
- [ ] `article.body` array accepts `{type: 'qaBlock'}`.
- [ ] Both `apps/studio` and `apps/studio-staging` Studios open without runtime errors (`pnpm --filter @kcvv/studio dev` and `@kcvv/studio-staging dev` both start clean).
- [ ] `apps/web/src/app/(main)/nieuws/[slug]/page.tsx` reads `articleType` and delegates to one of two paths: legacy renderer (anything not `interview`) or new `InterviewTemplate` (when `interview`).
- [ ] `InterviewTemplate` renders the existing `ArticleHeader` + `ArticleMetadata` + a `SanityArticleBody` that now knows how to render `qaBlock` via a new `QaBlock` component. Only the `standard` tag is implemented; unknown tags fall back to `standard`.
- [ ] `QaPairStandard` component matches the design: 4rem gutter with Quasimoda 700 `text-5xl` green numeral, Quasimoda 700 `text-xl` `kcvv-gray-blue` question, Montserrat 400 `text-lg` body answer, 1px `kcvv-gray-light` rule below (except last).
- [ ] Storybook story `Features/Articles/QaBlock` renders a two-pair `standard` example using a fixture; story passes `pnpm --filter @kcvv/web storybook:test` or equivalent CI check.
- [ ] Unit test `QaBlock.test.tsx`: given two pairs both tagged `standard`, renders two `QaPairStandard` children in order. Given no pairs, returns `null` (graceful empty).
- [ ] One test article created in Sanity staging with `articleType='interview'` + two-pair `qaBlock`; manual preview at the staging URL confirms rendering.
- [ ] Legacy articles (any without `articleType`) continue to render unchanged (default path). Verified by opening three existing `/nieuws/<slug>` URLs on staging.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 2 — #1328 — qaBlock full tag suite + subject

- [ ] New file: `packages/sanity-schemas/src/subject.ts` implements the `subject` object with `kind: 'player' | 'staff' | 'custom'` and conditionally-shown branches per design §4.2.
- [ ] `article.ts` adds `subject` field with `hidden` guard on non-interview types.
- [ ] `QaPairKey` component implements the full-bleed cream spread (`--color-foundation-gray-light`), 1px rules top+bottom, Quasimoda 400 clamp(1.75rem,3.5vw,2.5rem) answer, subject cutout floated to side at max 380px. Question rendered as caption above cutout column.
- [ ] `QaPairQuote` component implements the full-bleed cream breakout: decorative `"` glyph (U+201C) in Quasimoda 700 at 24rem desktop / 12rem mobile, `kcvv-green-bright` at opacity 0.12, absolutely positioned centered. Quote text Quasimoda 500 clamp(2rem,4vw,3rem) centered max-w-[42ch]. Attribution with 2rem × 2px green rule.
- [ ] `QaPairQuote` motion: IntersectionObserver triggers glyph fade 0→0.12 and scale 0.85→1.0 over 700ms `cubic-bezier(0.22, 1, 0.36, 1)`. `@media (prefers-reduced-motion: reduce)` snaps to final state — verified via Playwright/manual test toggling the system setting.
- [ ] `QaGroupRapidFire` collates consecutive `rapid-fire`-tagged pairs into one block with auto-rendered "— — — Sneltrein" header (three 0.5rem × 2px green bars, Quasimoda 700 `text-xs` uppercase green-dark). Grid `grid-cols-[1fr_1.3fr] gap-8` desktop, single column mobile.
- [ ] `SubjectAttribution` component resolves the three `kind` branches and returns `{ name, photo, role }`. When `kind='player'`, prefers `transparentImage` over `psdImage`.
- [ ] Storybook stories: `QaPairKey` (with player subject), `QaPairQuote` (with player subject, motion visible), `QaGroupRapidFire` (5-pair group), `SubjectAttribution` (player + staff + custom variants).
- [ ] Vitest tests for each component covering at least the happy path and one edge case (missing cutout, empty answer, reduced-motion branch).
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 3 — #1329 — Interview template polish

- [ ] `InterviewTemplate` renders hero per design §5.2: kicker `INTERVIEW | #${jerseyNumber} · ${positionUppercase}` pulled from `subject` autofill, subtitle line with subject full name, 4:5 portrait crop of `article.coverImage` via Sanity CDN hotspot, Quasimoda 700 clamp title.
- [ ] If `article.coverImage` is missing, the hero renders headline + subtitle only (no image frame).
- [ ] Metadata bar component is extracted (or existing `ArticleMetadata` refactored) to match design §7.6: mono small-caps, Lucide icons at 16px, thin rules.
- [ ] Article body column uses `max-w-[65ch]` within the 60rem inner width.
- [ ] `SubjectAttribution` integration is verified: `key` and `quote` qaBlock pairs pull the correct photo + name + role from all three subject kinds in staging fixtures.
- [ ] Storybook `Pages/Article/Interview` story composes the full page for a player-subject interview with a realistic 6-pair qaBlock mixing all four tags.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 4 — #1330 — Announcement template

- [x] `AnnouncementTemplate` component added. Default path when `articleType` is `announcement` or missing.
- [x] Hero per design §5.1: 16:9 `article.coverImage` via Sanity CDN hotspot, rounded-[4px], no overlay. Kicker with `.featured-border::before` bar and a Quasimoda 700 clamp title in sentence case. **Byline row intentionally dropped** — author + reading time live in the §7.6 metadata bar below the hero, and repeating them as a second line was pure duplication in practice. The same rule applies to the upcoming transfer + event heroes (Phases 5–6).
- [x] Drop-cap on first `<p>` inside `.article-body`: Quasimoda 700 `text-[5.5rem] leading-[0.85] kcvv-green-bright`, floated, 4 lines tall. Applied only to `announcement` and `transfer` body prose (not `interview` or `event`).
- [x] Body h2 preceded by 4rem × 2px `kcvv-green-bright` bar (reuse `.featured-border::before`).
- [x] Blockquote rework per design §7.4: rule-framed centered, Quasimoda 400 `text-2xl` gray-blue, 1px top+bottom rules. Scoped to `.article-body` so Studio previews are unaffected. The attribution line (mono small-caps + 2rem green rule prefix) is **deferred** — PortableText's default blockquote serializer has no structured slot for attribution; a dedicated `blockquoteAttribution` block/mark is tracked as a follow-up.
- [x] Body fade-up motion on scroll per design §7.5: all `<p>`/`<h2>`/`<h3>` inside `.article-body`. IntersectionObserver threshold 0.15, rootMargin `'0px 0px -10% 0px'`, 500ms `cubic-bezier(0.22, 1, 0.36, 1)`, 24px rise. `prefers-reduced-motion` snaps to final state.
- [x] Legacy articles (missing `articleType`) render through `AnnouncementTemplate` — verified via sibling `/nieuws/[slug]` routes in the Next.js build manifest. Five staging URLs listed in the PR body for visual smoke-testing.
- [x] Storybook `Pages/Article/Announcement` story with drop-cap + blockquote + one inline image.
- [x] `pnpm --filter @kcvv/web check-all` passes.

### Phase 5 — #1331 — Transfer template + transferFact

- [ ] New schema: `packages/sanity-schemas/src/transferFact.ts` per design §4.4 with all fields and conditional `hidden` guards.
- [ ] `article.body` accepts `{type: 'transferFact'}`.
- [ ] `TransferTemplate` renders the typographic hero per §5.3 (no image): kicker `TRANSFER | ${directionUppercase}`, programmatic from/to composition at display size.
- [ ] `TransferFactFeature` component matches design §8.1: full-bleed, player cutout column, from/to block with KCVV side auto-rendered (logo + name) and 2px green accent bar on the KCVV row. Note field when present.
- [ ] `TransferFactOverview` component matches design §8.1: body-column width, 1px top+bottom rules, `w-[7rem]` kicker, name row + logo row. Outgoing direction in `kcvv-gray` (not red — rejected in design).
- [ ] Direction rules respected: `incoming` = other→KCVV, `outgoing` = KCVV→other, `extension` = KCVV only + `until`.
- [ ] Storybook stories: feature and overview, one per direction (9 stories total), plus a composed `TransferTemplate` story.
- [ ] Vitest test: each direction renders the KCVV side auto-filled without an editor-provided KCVV club name.
- [ ] Integration test: `articleType='transfer'` + three `transferFact` blocks → first renders as feature, remaining two as overview cards.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 6 — #1332 — Event template + eventFact

- [ ] New schema: `packages/sanity-schemas/src/eventFact.ts` per design §4.5.
- [ ] `article.body` accepts `{type: 'eventFact'}`.
- [ ] `EventTemplate` renders the serif-style date-block hero per §5.4.
- [ ] `EventFactFeature` matches design §8.2: full-bleed, date block left with vertical 1px rule, title + metadata stack, Note PT, text-link CTA with Lucide `ArrowRight`.
- [ ] `EventFactOverview` matches design §8.2: body-column-width 1px-rule stack, `w-[5rem]` date column, CTA link right-aligned.
- [ ] CTA behavior: if `ticketUrl` missing, CTA hidden.
- [ ] Storybook stories: feature and overview, plus composed `EventTemplate`.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 7 — #1333 — Related slider restyle + JSON-LD + analytics

- [ ] `RelatedContentSlider` article-card variant restyled per design §7.7: cream surface, vertical 1px rules between cards (no borders), hover reveals 2px green underline under title. Other content-type cards inside the same slider retain current styling.
- [ ] JSON-LD builders in `apps/web/src/lib/seo/jsonld.ts`:
  - All types → `NewsArticle` or `Article`.
  - `event` type → additional `Event` JSON-LD populated from first `eventFact`.
  - `interview` type → `NewsArticle` with `about` → `Person` (subject).
  - `transfer` type → plain `NewsArticle`.
- [ ] JSON-LD validated with Google Rich Results Test (manual check, evidence attached to PR).
- [ ] Analytics events wired per design §11 using `trackEvent`:
  - `article_view` — page mount
  - `article_share` — share icon click
  - `related_article_click` — slider card click
  - `transfer_cta_click` — (no CTA in design, remove unless discovered needed during Phase 5)
  - `event_cta_click` — event CTA click
- [ ] Internal IDs hashed via `hashMemberId`; query/editorial text never sanitised-away but untouched-if-public per analytics rules in `apps/web/CLAUDE.md`.
- [ ] GA4 custom dimensions registered for new event parameters; GTM triggers added for new event names (manual step documented in the issue body).
- [ ] Sibling-hook audit performed before writing any new `useAnalytics` hook (per memory `feedback_analytics_instrumentation`).
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 8 — #1334 — Migration

- [ ] One-off Sanity migration script at `scripts/migrations/backfill-article-type.ts` (or equivalent path consistent with the repo's migration-script pattern) that sets `articleType='announcement'` on every `article` document where `articleType` is null.
- [ ] Dry-run mode + summary output (count per articleType after run).
- [ ] Run against staging, review, then production (per memory `feedback_sanity_migrations`).
- [ ] `docs/` editorial guide added for re-structuring existing interviews from hand-formatted bold/italic into `qaBlock`. One-pager with a before/after example.
- [ ] Audit tag taxonomy for interview signals — if a reliable "Interview" tag exists, an optional second migration pass auto-promotes those articles to `articleType='interview'`. Flagged for editor review, not auto-committed.
- [ ] `pnpm --filter @kcvv/web check-all` passes (script-only change; should be a no-op at web build time).

## 6. Effect Schema / api-contract changes

**None.**

Articles are read directly from Sanity via the web repository layer (`apps/web/src/lib/repositories/`); the BFF (`apps/api/`) is not involved in article fetching. The new body block types (`qaBlock`, `transferFact`, `eventFact`) are Sanity-native and consumed by `@portabletext/react` custom components on the frontend — no normalized cross-package types needed.

If a future phase decides to route article data through the BFF (e.g. for additional enrichment or caching), new schemas would go in `packages/api-contract/` at that time. This PRD does not add any speculatively.

## 7. Open questions

- [ ] **Hardcoded KCVV logo for `transferFact`** — where does the KCVV club logo asset live for auto-render on the KCVV side of transfer cards? Is there an existing token/static import, or does it come from a Sanity singleton? Resolved by Phase 5 investigation.
- [ ] **`subject.kind='custom'` coverage** — is the custom branch rare enough to defer beyond Phase 2, or are there upcoming articles (volunteer profiles, opposing-coach quotes) that need it at launch? Needs editorial input.
- [ ] **qaBlock Studio preview** — is the default array-of-objects preview inside Sanity Studio good enough for editors, or do we need a custom `preview` component showing the question + tag? Investigate during Phase 2; if needed, promote to Phase 7.
- [ ] **Legacy interview migration** — some current articles are interviews formatted with bold/italic. Do we auto-migrate them to `qaBlock` with a best-effort parser, or require manual editor re-entry? Recommended: editor re-entry (quality > quantity). Confirm with editors in Phase 8.
- [ ] **`rapid-fire` section header copy** — design specifies "— — — Sneltrein" auto-rendered. Is "Sneltrein" the right Dutch word, or should it be "Sneltreinronde" / "Snelle ronde"? Editor preference.
- [ ] **`event` type overlap with `/kalender`** — the club's calendar route also surfaces events. If an article has `articleType='event'` and announces a match or tournament, should `eventFact` data feed the calendar? Out of scope for this PRD but flag for later.
- [ ] **JSON-LD `Interview`** — schema.org lacks a canonical Interview type. The design doc suggests falling back to `NewsArticle` with `about`. Validate with the Rich Results Test in Phase 7 and document the final shape.
- [ ] **Fade-up motion with Server Components** — body fade-ups use IntersectionObserver, which is client-side. The article body is currently rendered server-side. Does the motion wrapper need to be a client component `<ArticleBodyMotion>` wrapping server-rendered children? Confirm architecture in Phase 4.
- [ ] **Storybook for motion** — how do we test the glyph grow-in for `QaPairQuote` in Storybook? Auto-run on story mount, or trigger on a control? Decide in Phase 2.

These are the questions most likely to need answering during implementation. They are not blockers for starting.

## 8. Discovered unknowns

Populated during implementation. Format:

```text
- [YYYY-MM-DD] Discovered: [what was found] → [action: new issue #N / PRD updated / resolved inline]
```

(empty)
