# PRD: Related Content Extension

**Status:** Draft
**Milestone:** [related-content-extension](https://github.com/soniCaH/www.kcvvelewijt.be/milestone/36)
**Issues:** #1316 (Phase 1 tracer), #1317 (Phase 2), #1318 (Phase 3), #1319 (Phase 4)
**Parent issue:** #1314 (tags autocomplete — sibling work on the `article` schema, not a blocker)

## 1. Problem Statement

Editors writing an article in Sanity Studio can only explicitly curate **other articles** as "related" (`article.relatedArticles`). The frontend already renders a richer mix — players, teams, and staff members appear in the Related section — but those only surface when they are linked inline in the article body via `internalLink` annotations. That means an editor cannot:

- Promote a player/team/staff member who is relevant but not named in the body.
- Relate an article to an **event** at all — events are absent from both the implicit (body links don't allow events) and explicit (no such reference) surfaces, even though events are a core content type.

The result is a stealth "grab-bag" behaviour where editors hack together inline links just to get entities into the Related sidebar, and events — arguably the most time-sensitive content type — get no editorial surfacing from articles.

## 2. Scope

| Package                               | Changes                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `packages/sanity-schemas`             | `article` schema gains `relatedContent` (mixed-type references); `event` schema gains `slug`                    |
| `apps/studio` + `apps/studio-staging` | Pick up schema change (no per-studio edits — schemas are shared)                                                |
| `apps/web`                            | GROQ projection, `mergeRelatedItems()` dedupe logic, `RelatedContentCard` event variant, `/events/[slug]` route |
| `apps/api`                            | None                                                                                                            |
| `packages/api-contract`               | None                                                                                                            |

**In scope:**

- Extend `article` with a single `relatedContent` array field accepting references to `article`, `player`, `team`, `staffMember`, and `event`.
- Rename / migrate away from `relatedArticles` — values are preserved as `relatedContent` entries of type `article`.
- Dedupe curated `relatedContent` entries against the auto-derived `mentioned*` arrays (editor-picked wins; same `_id` is not rendered twice).
- Add `RelatedEventItem` variant to `RelatedContentCard` with event-specific card body (date, optional location).
- Add `slug` field to `event` schema and build `/events/[slug]` detail page with metadata + JSON-LD `Event`.
- Update analytics: `target_type` dimension gains `"event"`; GTM DLV + GA4 custom-dimension mapping updated per `apps/web/CLAUDE.md` analytics checklist.

**Out of scope:**

- Adding `sponsor` or `page` to related content (sponsors have no detail page; pages are already reachable via body `internalLink`).
- Redesigning the Related sidebar layout or slider behaviour (`RelatedContentSlider` stays as-is).
- Changing how auto-derived mentions work (`mentionedPlayers`/`mentionedTeams`/`mentionedStaffMembers` GROQ stays as-is).
- Event attendance/RSVP features on the new event detail page — page is read-only editorial.
- Reverse relations (showing "articles referencing this event" on the event page).
- Staff "no href" behaviour in `RelatedContentCard.getHref` — noted but kept as-is unless it surfaces during Phase 2 (see Open Questions).

## 3. Tracer Bullet

A single article in staging has `relatedContent` populated with **one curated player** (not mentioned in its body). The article page at `/nieuws/<slug>` renders a Related section containing that player card, rendered by the existing `RelatedPlayerItem` variant of `RelatedContentCard`. The player does **not** appear twice if they are also mentioned in the body (dedupe proof).

Proves end-to-end:

1. Sanity schema accepts a non-article reference type in a single `relatedContent` array.
2. GROQ projection reads the mixed array correctly (`relatedContent[]->` with conditional spreads per `_type`).
3. `mergeRelatedItems()` merges curated + auto-derived sources and dedupes by `_id`.
4. Existing `RelatedContentCard` variants render curated entries without code change.

No event work yet. No new card variant. No studio UX polish. Just proves the architecture extends.

## 4. Phases

```text
Phase 1: Tracer bullet — relatedContent accepts one curated player, dedupe works (#1316)
Phase 2: Full explicit curation — article, player, team, staffMember (dedupe + migration) (#1317)
Phase 3: Event detail pages — slug, route, metadata, JSON-LD Event (#1318)
Phase 4: Event in related content — RelatedEventItem card variant + analytics update (#1319)
```

Phase 3 is blocked-by Phase 2 (needs the extended `relatedContent` field landed). Phase 4 is blocked-by Phase 3 (needs a real URL to link to).

## 5. Acceptance Criteria Per Phase

### Phase 1 — Tracer bullet

- [x] `article.relatedContent` field exists in `packages/sanity-schemas/src/article.ts` as `array` of `reference` to `[article, player]` (minimal set for tracer).
- [x] Staging studio (`apps/studio-staging`) lets an editor pick a player as related on an article.
- [x] GROQ projection in `apps/web/src/lib/repositories/article.repository.ts` reads `relatedContent[]->` with `_type`-conditional field selection.
- [x] `mergeRelatedItems()` dedupes by `_id` between curated `relatedContent` and auto-derived `mentionedPlayers` (unit test).
- [ ] Test article on staging renders Related section with the curated player card. _(Run `node apps/web/scripts/seed-phase-1316-related-content-tracer.mjs` and visit `/nieuws/phase-1316-tracer-curated-related-content` on staging.)_
- [x] `pnpm --filter @kcvv/web check-all` passes.

### Phase 2 — Full explicit curation

- [ ] `relatedContent` accepts references to `article`, `player`, `team`, `staffMember`.
- [ ] Self-reference filter on `article` type (`_id != ^._id`) so an article can't relate to itself.
- [ ] Validation: `max(8)` on `relatedContent` array (soft cap to discourage grab-bag use).
- [ ] Migration script copies existing `relatedArticles` values into `relatedContent` preserving order; run on staging then production per `feedback_sanity_migrations.md`.
- [ ] `relatedArticles` field removed from schema after migration verified.
- [ ] Dedupe tested for all three auto-derived sources (players, teams, staff) against curated entries.
- [ ] Storybook story updated: `Features/Related/` shows curated + auto mix (no new variant yet).
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 3 — Event detail pages

- [ ] `event` schema gains `slug` field (source: `title`, required, unique).
- [ ] Existing event documents get slugs via migration (staging then production).
- [ ] `/events/[slug]/page.tsx` route renders title, dateStart/dateEnd, cover image, externalLink (if present), and any body content the schema provides.
- [ ] `generateMetadata` exports title/description/OG fields per `apps/web/CLAUDE.md` SEO checklist.
- [ ] JSON-LD `Event` block rendered via new builder in `src/lib/seo/jsonld.ts`, validated with Google Rich Results Test.
- [ ] Canonical URL set; route appears in `sitemap.ts`.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 4 — Event in related content

- [ ] `relatedContent` schema accepts `event` references.
- [ ] `RelatedEventItem` added to `apps/web/src/components/related/types.ts` (fields: `id`, `title`, `slug`, `dateStart`, `dateEnd | null`, `imageUrl | null`, `source`).
- [ ] `RelatedContentCard` gains `case "event"` in every switch (`getHref` → `/events/[slug]`, `getTargetSlug`, `getImageAlt`, `getImageUrl`, `CardContent` with date-forward layout).
- [ ] `RelatedPageType` union updated; analytics `target_type` dimension accepts `"event"`.
- [ ] GTM DLV + GA4 custom-dimension mapping updated; manual verification in GTM Preview + GA4 DebugView.
- [ ] Storybook variant `Features/Related/RelatedContentCard` — new event story.
- [ ] Vitest coverage for event branch of `mergeRelatedItems()` and `RelatedContentCard`.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

## 6. Effect Schema / api-contract Changes

**None.** Related content is fetched directly from Sanity via GROQ in `article.repository.ts`; it does not cross the BFF boundary. Event detail pages likewise read Sanity directly — no `packages/api-contract` changes and no new HttpApi endpoint.

Sanity schema changes only:

- `article.relatedContent: array<reference>` (replaces `relatedArticles`).
- `event.slug: slug`.

## 7. Open Questions

- [ ] **Field name:** `relatedContent` vs keep `relatedArticles` and add siblings (`relatedPlayers`, `relatedTeams`, etc.)? Single mixed array is cleaner editorially but GROQ is slightly chunkier. **Recommendation: single mixed array.** Needs user confirmation before Phase 1.
- [ ] **Soft cap:** is `max(8)` the right number, or should curation be unlimited with UI-side slicing? Answered by Phase 2 editor feedback.
- [ ] **Migration of existing `relatedArticles`:** run migration script via `sanity migrate` or hand-write a node script? Defer to migration-writing step in Phase 2.
- [ ] **Staff `href = null` in `RelatedContentCard.getHref`:** pre-existing inconsistency (`buildRelatedContent()` generates `/club/organigram?member=…` but the card returns `null`). In scope to fix during Phase 2, or keep as-is? Needs user decision.
- [ ] **Event card body fields:** date + location, or date + excerpt-style subtitle? `event` schema has no `location` field today — adding one is extra scope. Answered by Phase 3 schema discussion.
- [ ] **External-link events:** if an event has both a `slug` (→ detail page) and an `externalLink`, which wins on click? **Default: internal detail page always wins** (externalLink becomes a CTA on the detail page itself). Confirm with user.
- [ ] **Self-exclusion for events:** should an event's own detail page show related articles that reference it? Out of scope (reverse relation) — flag as a candidate follow-up.
- [ ] **JSON-LD Event schema:** minimal (`name`, `startDate`, `endDate`, `image`) or full (`location`, `organizer`, `eventStatus`)? Answered during Phase 3 — start minimal.

## 8. Discovered Unknowns

<!-- Populated during Ralph loop. Format: -->
<!-- - [YYYY-MM-DD] Discovered: <finding> → <action: new issue #N / PRD updated / resolved inline> -->
