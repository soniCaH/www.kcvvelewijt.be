# PRD: News Pages Redesign

**Parent issue:** #690
**Design inspiration:** #730 (Sporting Hasselt, Real Madrid, Inter Miami CF)
**Related:** #931 (RelatedContentCard + RelatedContentSlider — independent, replaces ArticleFooter later)

## 1. Problem Statement

The news listing (`/news`) and article detail (`/news/[slug]`) pages still use the legacy Gatsby-era design — white cards with shadow overlays, a green pattern-image header, and a sidebar metadata layout. This clashes with the dark, dramatic, diagonal-cut design language introduced on the homepage. The `ArticleCard` component duplicates the role of `NewsCard` (which already powers the homepage). Visitors experience a jarring visual break when navigating from the homepage to the news section.

## 2. Scope

**Packages:** `apps/web` only.

**In scope:**

- NewsCard evolution: relocate, add `listing` variant
- News listing page (`/news`): featured split, grid with infinite scroll, sticky filter bar
- Article detail page (`/news/[slug]`): full-bleed hero, inline metadata with breadcrumb, body content restyling
- Cleanup: delete ArticleCard, RelatedNews (dead code)

**Out of scope:**

- SectionStack / diagonal transitions on the news pages (decided: not needed)
- RelatedContentSlider (#931 — separate work, replaces ArticleFooter later)
- Sanity schema changes (categories are already tags in Sanity; editorial curation of which tags to show is a content decision)
- Search page redesign
- Homepage LatestNews changes (existing component continues to import NewsCard from new location)
- New design system primitives (FilterTabs already exists)

## 3. Tracer Bullet

Relocate `NewsCard` to `src/components/article/NewsCard/`, add the `listing` variant with Storybook story, and render it on `/news` in a simple 3-column grid replacing `ArticleCard`. No featured split, no infinite scroll, no detail page changes yet. This proves the component migration works end-to-end without breaking the homepage (which still imports NewsCard).

## 4. Phases

```
Phase 1: NewsCard relocation + listing variant (tracer bullet)         — #957
Phase 2: News listing page redesign (featured split, infinite scroll)  — #958 (blocked by #957)
Phase 3: Article detail page redesign (hero, metadata, breadcrumb)     — #959 (blocked by #957)
Phase 4: Article body content restyling (SanityArticleBody)            — #960 (blocked by #959)
Phase 5: Cleanup (delete ArticleCard, RelatedNews, old NewsCard file)  — #961 (blocked by #958, #960)
```

## 5. Acceptance Criteria per Phase

### Phase 1 — NewsCard relocation + listing variant

- [x] `NewsCard` moved from `src/components/home/LatestNews/NewsCard.tsx` to `src/components/article/NewsCard/NewsCard.tsx` with barrel export
- [x] Homepage `LatestNews` imports NewsCard from new location without breakage
- [x] New `variant: "listing"` — lighter card style (white/light background, image on top, title + date + badge below) suitable for dense archive grids
- [x] `listing` variant handles missing images gracefully (fallback pattern/color, not blank)
- [x] Storybook stories updated: title `Features/Articles/NewsCard`, all variants (standard, featured, listing) documented
- [x] NewsCard tests updated for new variant
- [x] `/news` page renders using NewsCard `listing` variant in simple 3-col grid (replacing ArticleCard)
- [x] `article/index.ts` barrel exports NewsCard
- [x] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 — News listing page redesign

- [x] PageTitle removed from `/news`
- [x] Top section: `2fr | 1fr` featured split — article 1 as `featured` variant, articles 2–3 as `standard` variant stacked right (reusing homepage LatestNews grid pattern)
- [x] Below featured: 3-column grid of `listing` variant cards
- [x] Category filtering: pill-style tabs using existing `FilterTabs` + `CategoryFilters` components — dynamically derived from article tags (as today, editor controls tag list in Sanity)
- [x] Sticky filter bar: filter pills stick to top of viewport when scrolled past, with appropriate z-index and background
- [x] Infinite scroll: Intersection Observer triggers Next.js Server Action to fetch next batch
- [x] Initial server-rendered batch: 3 featured + 6 grid = 9 articles
- [x] Subsequent batches: 6 articles each, appended as uniform grid rows (no featured treatment)
- [x] Loading state: skeleton cards or spinner while fetching next batch
- [x] Empty state: message when no articles match selected category
- [x] Category changes reset scroll position and article list
- [x] `pnpm --filter @kcvv/web check-all` passes

### Phase 3 — Article detail page redesign

- [x] Full-bleed hero image with dark gradient overlay and title text (matching NewsCard `featured` aesthetic)
- [x] Hero fallback when no cover image: solid dark background with title (no green pattern)
- [x] Metadata bar below hero: breadcrumb ("News > {Category}") left-aligned, date + author + share icons right-aligned
- [x] Breadcrumb category links back to `/news?category={slug}`
- [x] No sidebar — single-column layout for article body
- [x] Share buttons restyled to match new design language
- [x] ArticleHeader component redesigned in-place (not new component)
- [x] ArticleMetadata redesigned as inline horizontal bar (not sidebar)
- [x] `pnpm --filter @kcvv/web check-all` passes

### Phase 4 — Article body content restyling

- [x] `SanityArticleBody` Portable Text renderers updated to match new design language
- [x] Images: constrained to content column by default; optional full-bleed breakout (edge-to-edge viewport width) for editorial emphasis — replaces the old `-mr-80` sidebar-era hack
- [x] Blockquotes: restyle with design tokens (not hardcoded green border)
- [x] Tables: restyle with design tokens
- [x] Links: consistent styling with rest of site
- [x] File attachments: restyle download button
- [x] Typography: review heading hierarchy, paragraph spacing, line-height for reading comfort
- [x] `pnpm --filter @kcvv/web check-all` passes

### Phase 5 — Cleanup

- [x] Delete `src/components/article/ArticleCard/` (component, tests, stories, barrel)
- [x] Delete `src/components/article/RelatedNews/` (component, tests, stories, barrel)
- [x] Remove ArticleCard and RelatedNews exports from `src/components/article/index.ts`
- [x] Delete `src/components/article/NewsOverview.stories.tsx` if it references deleted components
- [x] Remove old `home/LatestNews/NewsCard.tsx` file (now at article/NewsCard/)
- [x] Verify no dead imports remain: `pnpm --filter @kcvv/web lint:fix`
- [x] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. All data flows (Sanity articles, tags) already exist. The infinite scroll Server Action fetches from the same `SanityService.getArticles()` with offset/limit parameters — this may require a new Sanity query variant but no schema changes.

## 7. Open Questions

- [x] **Sanity query for paginated articles:** Current `getArticles()` fetches all articles at once and paginates in-memory. Infinite scroll needs cursor-based or offset/limit Sanity GROQ queries for efficiency. — **Resolved during Phase 2 implementation.**
- [x] **Category list source:** Categories remain dynamically derived from article tags (as today). The editor controls which tags exist in Sanity; the filter pills show whatever tags articles have. The editor will reduce the tag list themselves. — **Resolved: keep dynamic, no code changes needed.**
- [x] **Listing card visual design:** The `listing` variant needs concrete visual specs (colors, spacing, typography). Use `/design-an-interface` during Phase 1 to finalize. — **Resolved during Phase 1.**
- [x] **Body image treatment (Phase 4):** Constrain images to content column width by default. Add a full-viewport-width breakout option for editorial emphasis — images break out symmetrically to both left and right viewport margins, outside the article container. — **Resolved: constrain default + optional full-bleed breakout.**
- [x] **Article detail hero aspect ratio:** What aspect ratio for the full-bleed hero? 16:9? 21:9 (cinematic)? Match the NewsCard featured 3:2? — **Resolved during Phase 3 implementation.**

## 8. Discovered Unknowns (filled during implementation)

- [2026-03-20] Discovered: `paginateResults` helper cannot live in a `"use server"` file (all exports must be async). Moved to separate `utils.ts` → resolved inline
- [2026-03-20] Discovered: GROQ category filter uses `select($category == "" => true, $category in tags)` pattern for optional filtering → resolved inline
- [2026-03-21] Phase 5 cleanup complete: deleted ArticleCard, RelatedNews, NewsOverview.stories.tsx; updated barrel exports; all acceptance items verified
