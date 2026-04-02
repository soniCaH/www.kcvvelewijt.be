# PRD: Repository Pipeline Simplification — Fewer Transforms, Tighter Projections

**Status**: Ready for implementation
**Date**: 2026-04-02
**Builds on**: #849 (Sanity repository layer — closed)
**Issues**: #1191 (article tracer bullet), #1192 (remaining repos + audit)

---

## 1. Problem Statement

Each of the 10 Sanity repositories in `apps/web` follows a 3-layer pattern: GROQ query → ViewModel interface → transform function. The transforms handle field renaming (`_id` → `id`, `slug.current` → `slug`), null coalescing (`?? ""`), and date formatting. Most of this can be done directly in the GROQ projection (`"id": _id`, `"slug": slug.current`, `coalesce(title, "")`), eliminating the intermediate ViewModel interface and the transform function entirely. Some repositories add a second ViewModel layer (e.g., `ArticleVM` → `HomepageArticle`) that reshapes data for a specific component — understanding what a component receives requires reading the GROQ query, the first ViewModel, the second ViewModel, and the transform function. Fewer types and transforms means fewer places to update when a Sanity schema changes.

## 2. Scope

**Packages touched**: `apps/web`

**In scope**:

- Push field renaming and null coalescing into GROQ projections where GROQ supports it
- Eliminate intermediate ViewModel interfaces where the GROQ result type (from `sanity typegen`) already matches component needs
- Keep transforms only where they do real work (date formatting, filtering, conditional logic)
- Update repository tests to test at the boundary (mock Sanity client → assert final shape)

**Out of scope**:

- Changing component props or visual behavior
- Modifying Sanity schemas
- BFF/api-contract changes
- Adding new GROQ queries or repositories
- Repositories where the current transform is genuinely complex (e.g., `staff.repository.ts` with its hierarchical member→responsibilityPaths join)

## 3. Tracer Bullet

Simplify `article.repository.ts` → `toArticleVM()`:

- Move `"id": _id`, `"slug": slug.current`, `coalesce(title, "")`, `coalesce(featured, false)`, `coalesce(tags, [])` into the GROQ projection
- The typegen result type (`ARTICLES_QUERY_RESULT`) now matches `ArticleVM` directly
- Remove the `ArticleVM` interface and `toArticleVM` function
- Repository method returns the GROQ result type directly
- Existing tests adapted to assert on GROQ result shape
- `pnpm --filter @kcvv/web check-all` passes

## 4. Phases

```text
Phase 1: Tracer bullet — simplify article list transform (toArticleVM)
Phase 2: Simplify remaining simple repositories (event, sponsor, page, homepage)
Phase 3: Audit and simplify component-specific ViewModels (HomepageArticle, etc.)
```

## 5. Acceptance Criteria per Phase

### Phase 1: Tracer bullet

- [ ] `ARTICLES_QUERY` GROQ projection handles field renaming and null coalescing
- [ ] `toArticleVM` function removed or reduced to only fields GROQ can't handle
- [ ] `ArticleVM` interface removed if GROQ result type is sufficient, or kept as a type alias
- [ ] Repository tests updated
- [ ] Components consuming `ArticleVM` still compile and render correctly
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2: Simplify remaining simple repositories

- [ ] Same treatment applied to: `event.repository.ts`, `sponsor.repository.ts`, `page.repository.ts`, `homepage.repository.ts`
- [ ] Each repository reviewed — only simplify where the transform is purely renaming/coalescing
- [ ] Skip repositories with complex transforms (staff, responsibility — these have joins/hierarchy logic)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3: Audit component-specific ViewModels

- [ ] Identify all secondary ViewModels (e.g., `HomepageArticle`, `CalendarMatch`)
- [ ] Where possible, merge into the primary query projection (fetch exactly what the component needs)
- [ ] Where a secondary ViewModel serves multiple consumers, keep it but document why
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. Repositories use Sanity typegen types, not Effect Schema.

## 7. Open Questions

- [ ] Does `coalesce()` in GROQ handle all null-coalescing cases, or are there edge cases (e.g., `slug.current` on a missing slug)? — Tracer bullet will answer
- [ ] Will removing `ArticleVM` break component type imports elsewhere? — Grep for imports during Phase 1
- [ ] Should we regenerate `sanity.types.ts` as part of this work to ensure typegen picks up projection changes? — Likely yes, add to Phase 1

## 8. Discovered Unknowns

_(filled during implementation)_

- [2026-04-02] Discovered: coalesce() in GROQ handles all null-coalescing cases including slug.current on missing slug → resolved inline (returns empty string)
- [2026-04-02] Discovered: coverImageUrl null→undefined conversion cannot be done in GROQ — resolved by changing downstream consumers to accept string|null instead of string|undefined
