# PRD: Sanity Repository Layer

**Issue**: #849
**Status**: Ready for implementation
**Date**: 2026-03-19

---

## 1. Problem Statement

All Sanity-managed content (players, teams, articles, sponsors, events, banners, staff, responsibility paths, pages) flows through three untested transformation layers before reaching UI components:

1. `lib/sanity/queries/` — GROQ strings with hand-projected fields
2. `SanityService.ts` — 13 methods returning **hand-maintained** TypeScript interfaces (`SanityPlayer`, `SanityTeam`, `SanityArticle`, …) with no runtime validation
3. Page-level `utils.ts` or `lib/mappers/` — transforms Sanity shapes into component props

**No layer is tested against the adjacent layer.** Concrete failure modes:

- A GROQ projection change (add/remove a field) does not update the `SanityService` interface → field silently missing at runtime
- Sanity schema adds a required field → GROQ doesn't fetch it → interface doesn't declare it → component receives `undefined` unexpectedly
- Two pages transform the same Sanity type differently — a bug fixed in one `utils.ts` is silently absent in the other
- `SanityService` interfaces are hand-maintained in three places: Sanity schema, GROQ query, TypeScript interface — any of the three can drift from the others with no build-time signal

## 2. Scope

**Packages touched**: `apps/web`, `apps/studio`

**In scope**:

- Set up `sanity typegen generate` in `apps/studio` — auto-generates TypeScript types from annotated GROQ queries, eliminating hand-maintained interfaces permanently
- Replace `SanityService` with focused Effect repositories, one per domain entity:
  - `PlayerRepository` — players for team roster + player detail page
  - `TeamRepository` — teams for navigation + team detail page
  - `ArticleRepository` — articles for news list + article detail; absorbs `lib/mappers/article.mapper.ts`
  - `SponsorRepository` — sponsors page
  - `EventRepository` — events page + next featured event for homepage
  - `HomepageRepository` — homepage banners
  - `StaffRepository` — org chart / staff page
  - `ResponsibilityRepository` — help / responsibility paths
  - `PageRepository` — generic CMS pages
- Each repository owns: annotated GROQ query, generated TypeScript types (via typegen), VM type definition, mapping function, Effect service tag + live layer
- Each repository PR migrates **all** consuming pages in the same PR and deletes the corresponding `SanityService` method(s) — no legacy left behind, always deployable after each merge
- Delete `SanityService.ts` and `lib/sanity/queries/` barrel entirely once all repositories are in place

**Out of scope**:

- `apps/api`, `packages/api-contract` — zero changes
- Sanity Studio schema changes — typegen reads the existing schema
- Visual changes to any page
- `lib/mappers/match.mapper.ts` — match data comes from BFF, not Sanity; separate concern

## 3. Tracer Bullet

Set up `sanity typegen generate` as a standalone step — the foundation every repository depends on:

- `sanity typegen generate` runs in `apps/studio` and produces typed output for annotated GROQ queries
- Annotate `PLAYERS_QUERY` in `lib/sanity/queries/players.ts` with the typegen tag — verify the generated type matches the hand-maintained `SanityPlayer` interface field-for-field
- Turbo pipeline adds a `typegen` task in `apps/studio` that `apps/web#build` depends on
- CI verifies typegen output is up to date (schema + query drift caught at build time, not runtime)
- `pnpm turbo build --filter=@kcvv/web` passes with generated types in place

This is safe, zero-risk, and immediately proves the tooling before any repository is built.

## 4. Phases

```
Phase 0 (tracer bullet): Setup sanity typegen; annotate PLAYERS_QUERY; wire into turbo + CI → #881
Phase 1: PlayerRepository — findAll(), findByPsdId() → PlayerVM; migrate pages; delete SanityService methods → #882
Phase 2: TeamRepository — findAll(), findBySlug() → TeamVM; migrate nav + team page; delete SanityService methods → #883
Phase 3: ArticleRepository — findAll(), findBySlug() → ArticleVM; absorb article.mapper.ts; migrate news pages → #884
Phase 4a: SponsorRepository → #885
Phase 4b: EventRepository → #886
Phase 4c: HomepageRepository → #887
Phase 5a: StaffRepository → #888
Phase 5b: ResponsibilityRepository → #889
Phase 6: PageRepository → #890
Phase 7: Delete SanityService.ts + lib/sanity/queries/ barrel → #891
```

> **Parallelism**: Phases 2–6 are all blocked on Phase 1 (pattern proof) but independent of each other — they can run in parallel worktrees after Phase 1 merges.

## 5. Acceptance Criteria

### Phase 0 — sanity typegen setup

- [ ] `sanity typegen generate` runs successfully in `apps/studio` with no errors
- [ ] `PLAYERS_QUERY` annotated with Sanity typegen GROQ tag; generated type produced
- [ ] Generated types committed to repo (or CI step verifies freshness if gitignored)
- [ ] `turbo.json` includes `studio#typegen` as a dependency of `web#build`
- [ ] `pnpm turbo build --filter=@kcvv/web` passes end-to-end

### Phase 1 — PlayerRepository

- [ ] `PlayerRepository` Effect tag + `PlayerRepositoryLive` layer in `apps/web/src/lib/repositories/player.repository.ts`
- [ ] `PLAYERS_QUERY` and `PLAYER_BY_PSD_ID_QUERY` annotated; generated types used — no hand-maintained `SanityPlayer` interface in this file
- [ ] `PlayerVM` type defined: `{ id, firstName, lastName, position, number?, imageUrl?, href, bio?, birthDate?, nationality?, height?, weight? }` — full shape covering both team roster and player detail page
- [ ] `PlayerRepository.findAll()` test: fixture GROQ result → asserts all PlayerVM fields correct, position fallback hierarchy (keeper → position → positionPsd → "Speler"), imageUrl fallback (transparentImageUrl → psdImageUrl)
- [ ] `PlayerRepository.findByPsdId()` test: returns null for unknown psdId
- [ ] `team/[slug]/page.tsx` uses `PlayerRepository.findAll()` — no `SanityService.getPlayers()` call remaining
- [ ] `players/[slug]/page.tsx` uses `PlayerRepository.findByPsdId()` — no `SanityService.getPlayerByPsdId()` call remaining
- [ ] `SanityService.getPlayers()`, `SanityService.getPlayerByPsdId()` deleted; `SanityPlayer` interface deleted
- [ ] `transformSanityPlayerToRoster()` in `team/[slug]/utils.ts` deleted (absorbed into repository)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 — TeamRepository

- [ ] `TeamRepository` Effect tag + live layer in `apps/web/src/lib/repositories/team.repository.ts`
- [ ] `TEAMS_QUERY`, `TEAM_BY_SLUG_QUERY`, nav queries annotated; generated types used
- [ ] `TeamNavVM` (for navigation), `TeamDetailVM` (for team page) types defined
- [ ] Tests: `findAll()` with fixture → TeamNavVM[] correct; `findBySlug()` → TeamDetailVM correct; null for unknown slug
- [ ] Team navigation + `team/[slug]/page.tsx` migrated; relevant `team/[slug]/utils.ts` transforms absorbed into repository
- [ ] `SanityService.getTeams()`, `SanityService.getTeamBySlug()` deleted; `SanityTeam`, `SanityStaffMember` interfaces deleted (or moved into repository if still needed)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3 — ArticleRepository

- [ ] `ArticleRepository` in `apps/web/src/lib/repositories/article.repository.ts`
- [ ] `ARTICLES_QUERY`, `ARTICLE_BY_SLUG_QUERY` annotated; generated types used
- [ ] `ArticleVM` and `ArticleDetailVM` types defined; `mapSanityArticleToHomepageArticle` absorbed into repository
- [ ] Tests cover: field mapping, `includeDescription` flag, null imageUrl, empty tags
- [ ] News list page + article detail page + homepage article sections migrated
- [ ] `SanityService.getArticles()`, `SanityService.getArticleBySlug()` deleted; `SanityArticle` deleted
- [ ] `lib/mappers/article.mapper.ts` deleted (fully absorbed)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phases 4a–4c — Sponsor / Event / Homepage repositories

Each follows the same acceptance criteria pattern:

- [ ] Repository file in `lib/repositories/`; GROQ query annotated; generated types used
- [ ] VM type defined; at least one test with fixture data
- [ ] All consuming pages migrated in the same PR
- [ ] Corresponding `SanityService` method(s) and interface(s) deleted
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 5a — StaffRepository

- [ ] `StaffRepository` with `findAll() → OrgChartNode[]`
- [ ] `mapOrgMember()` and `CLUB_ROOT_NODE` absorbed into repository; `SanityOrgMember` deleted
- [ ] Staff page migrated; `SanityService.getStaffMembers()` deleted
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 5b — ResponsibilityRepository

- [ ] `ResponsibilityRepository` with `findAll() → ResponsibilityPathVM[]`
- [ ] `mapResponsibilityPath()`, `mapContact()`, `CONTACT_PROJECTION` absorbed; `SanityResponsibilityPath` etc. deleted
- [ ] Help page migrated; `SanityService.getResponsibilityPaths()` deleted
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 6 — PageRepository

- [ ] `PageRepository` with `findBySlug(slug) → PageVM | null`
- [ ] Consuming pages migrated; `SanityService.getPage()` deleted; `SanityPage` deleted
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 7 — Delete SanityService

- [ ] `apps/web/src/lib/effect/services/SanityService.ts` deleted
- [ ] `apps/web/src/lib/sanity/queries/` directory deleted (queries now live inside repositories)
- [ ] No import of `SanityService` anywhere in `apps/web`
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. All changes are within `apps/web` and `apps/studio`.

## 7. Open Questions

- `[x]` **Generated types file location**: Resolved — types output to `apps/web/src/lib/sanity/sanity.types.ts`. Config in `apps/studio/sanity.cli.ts` `typegen.generates` points to `../web/src/lib/sanity/sanity.types.ts`. No cross-workspace dependency needed.
- `[ ]` **PlayerVM scope**: Does `players/[slug]/page.tsx` currently render bio (PortableText), birthDate, nationality, height, weight? These exist in `SanityPlayer` but are not used in `transformSanityPlayerToRoster`. Verify during Phase 1 before finalising `PlayerVM` shape.
- `[ ]` **TeamDetailVM vs. separate queries**: `findBySlug()` currently returns data for roster, staff, schedule, standings, tagline in one GROQ query. Determine whether `TeamDetailVM` is one flat object or whether the repository should expose separate fine-grained methods. Resolve during Phase 2 design.
- `[ ]` **SanityTrainingSession**: Used in `SanityTeam` for training schedule display. Verify it should be absorbed into `TeamDetailVM` or kept as a sub-type inside the repository file.

## 8. Discovered Unknowns

- [2026-03-24] Phase 0: `SanityPlayer.psdId` is typed as `string` (non-nullable) but typegen generates `string | null` — the Sanity schema allows null. Hand-maintained type is inaccurate. → resolved in Phase 1 when PlayerRepository replaces SanityPlayer with generated type.
- [2026-03-24] Phase 0: `SanityPlayer.keeper` is typed as `boolean` (non-nullable) but typegen generates `boolean | null` — same root cause. → resolved in Phase 1.
- [2026-03-24] Phase 0: `SanityPlayer.position` is typed as `string | null` but typegen generates a precise enum union (`"Keeper" | "Verdediger" | "Middenvelder" | "Aanvaller" | "Speler" | null`). → Phase 1 should use the generated enum type.
- [2026-03-24] Phase 0: `SanityPlayer.bio` is typed as `unknown` but typegen generates a full Portable Text array type. → Phase 1 should use the generated type.
- [2026-03-24] Phase 0: Deprecated `sanity-typegen.json` config file format. Migrated to `typegen` key in `sanity.cli.ts` instead. → resolved inline.
- [2026-03-24] Phase 0: Generated types file location resolved — types output to `apps/web/src/lib/sanity/sanity.types.ts` directly. No cross-workspace dependency needed. `apps/web` imports from its own `lib/sanity/` directory.
