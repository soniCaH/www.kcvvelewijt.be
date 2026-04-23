# PRD: Analytics Framework

**Issue**: #685
**Status**: Ready for implementation
**Date**: 2026-03-19

---

## 1. Problem Statement

The site has zero visibility into user behaviour. There is no way to answer:

- Do users find the right person in the responsibility finder, or do they abandon?
- When 100 users visit `/search`, how many click through to a result?
- Which organigram view (cards/chart/responsibilities) is actually used?
- What pages have high bounce rates?

Without data, design and content decisions are based on intuition. The cookie consent banner (#788) already supports an `analytics` category — the infrastructure is ready but unused.

## 2. Scope

**Packages touched**: `apps/web`

**In scope**:

- GTM container script integration, gated behind `vanilla-cookieconsent` analytics consent
- `@next/third-parties` package for GTM script loading
- Typed `dataLayer.push()` helper with consent guard
- Event taxonomy: responsibility finder funnel, search funnel, organigram usage
- Dwell-time tracking on responsibility finder `ResultCard` as primary success signal
- GA4 property and GTM container creation documented as manual prerequisites

**Out of scope**:

- GTM tag/trigger/variable configuration — done in GTM web UI, not in code
- GA4 dashboard setup or custom reports
- Server-side analytics
- A/B testing framework
- Explicit feedback widget (#768 — separate issue)

## 3. Event Taxonomy

All events use `snake_case`. Parameters follow GA4 conventions where possible.

### Responsibility Finder (Priority 1 — "did the user find the right person?")

| Event Name                          | Trigger                                     | Parameters                                     |
| ----------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| `responsibility_role_selected`      | User picks role in dropdown                 | `role`                                         |
| `responsibility_search`             | Debounced search fires (300ms)              | `query_length`, `role`, `results_count`        |
| `responsibility_no_results`         | Search returns empty                        | `query_text`, `role`                           |
| `responsibility_suggestion_clicked` | User clicks a suggestion                    | `path_id`, `category`, `position` (1-indexed)  |
| `responsibility_contact_clicked`    | User clicks email/phone on ResultCard       | `path_id`, `contact_type` ("email" \| "phone") |
| `responsibility_organigram_link`    | User clicks "Bekijk in organigram"          | `path_id`, `member_id`                         |
| `responsibility_step_link_clicked`  | User clicks a step link                     | `path_id`, `step_index`                        |
| `responsibility_dwell`              | User views ResultCard for 5+ seconds        | `path_id`, `dwell_seconds`, `category`         |
| `responsibility_abandon`            | User navigates away with no result selected | `role`, `query_length`, `had_results`          |

**Funnel**: role_selected → search → suggestion_clicked → (contact_clicked \| dwell \| abandon)

### Search (Priority 2 — "do search results drive clicks?")

| Event Name              | Trigger                  | Parameters                                               |
| ----------------------- | ------------------------ | -------------------------------------------------------- |
| `search_submitted`      | User submits search form | `query_text`, `query_length`                             |
| `search_results_shown`  | Results rendered         | `results_count`, `query_text`                            |
| `search_no_results`     | Empty state shown        | `query_text`                                             |
| `search_filter_changed` | User clicks filter tab   | `filter_type` ("all" \| "article" \| "player" \| "team") |
| `search_result_clicked` | User clicks a result     | `result_type`, `result_title`, `position`                |

**Funnel**: search_submitted → results_shown → (result_clicked \| filter_changed \| abandon)

### Organigram (Priority 3 — "how is the org chart used?")

| Event Name                       | Trigger                        | Parameters                                                                                   |
| -------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| `organigram_view_changed`        | User switches tab              | `view` ("cards" \| "chart" \| "responsibilities"), `source` ("tab" \| "swipe" \| "keyboard") |
| `organigram_member_clicked`      | User clicks a member           | `member_id`, `view`                                                                          |
| `organigram_search_used`         | User searches in chart         | `query_text`                                                                                 |
| `organigram_department_filtered` | User changes department filter | `department`                                                                                 |
| `organigram_export_png`          | User exports chart as PNG      | —                                                                                            |

### Article detail (Priority 4 — "what do readers do on article pages?")

Driven by the article-detail redesign (#1327 → #1334). Hook: `useArticleAnalytics`.
Article ids are hashed via `hashMemberId`; no editorial strings flow into params.

| Event Name              | Trigger                        | Parameters                                                              |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| `article_view`          | Article detail page mount      | `article_type`, `article_id_hashed`, `has_subject`, `subject_kind?`     |
| `article_share`         | Share icon click               | `article_type`, `article_id_hashed`, `channel` ("native" \| "facebook") |
| `related_article_click` | Related grid card click        | `article_type`, `related_article_id_hashed`, `position`                 |
| `event_cta_click`       | Event ticket/signup link click | `article_id_hashed`, `event_date`, `has_ticket_url`                     |

`article_type` normalises to `announcement` when the Sanity field is null
(legacy articles). `subject_kind` is only emitted when `has_subject=true`.
`related_article_click` fires alongside the page-agnostic
`related_content_click` so BI continuity with non-article source pages is
preserved.

## 4. Tracer Bullet

GTM script integration + consent gating + one test event:

- Install `@next/third-parties`
- Load GTM in `layout.tsx`, gated behind `CookieConsent.getCategoryConsent('analytics')`
- Create typed `trackEvent(name, params)` helper that guards on consent + pushes to dataLayer
- Fire one test event (`page_section_view` or similar) on the homepage to verify the full pipeline: consent granted → dataLayer.push → GTM receives → GA4 records
- Document manual prerequisites: create GTM container, create GA4 property, link them

## 5. Phases

```
Phase 0 (tracer bullet): GTM integration + consent gating + trackEvent helper + one test event → #896
Phase 1: Responsibility finder funnel — all events from taxonomy table above → #897
Phase 2: Search funnel — all events from taxonomy table above → #898
Phase 3: Organigram usage — all events from taxonomy table above → #899
```

## 6. Acceptance Criteria

### Phase 0 — GTM + consent integration

- [ ] `@next/third-parties` added to `apps/web/package.json`
- [ ] GTM script loaded in `layout.tsx` via `<GoogleTagManager gtmId={...} />`
- [ ] GTM ID from env var `NEXT_PUBLIC_GTM_ID` — not hardcoded
- [ ] Script only loads when `CookieConsent.getCategoryConsent('analytics')` returns true
- [ ] Re-evaluates on consent change (user grants/revokes analytics in preferences modal)
- [ ] `src/lib/analytics/track-event.ts` exports `trackEvent(name: string, params?: Record<string, unknown>)` that: checks consent, pushes to `window.dataLayer`, is a no-op in SSR
- [ ] TypeScript type for `window.dataLayer` declared (ambient or module augmentation)
- [ ] One test event fires on homepage and appears in GTM debug preview
- [ ] `README` section or `docs/` file documenting: how to create GTM container, link GA4, expected env vars
- [ ] `pnpm --filter @kcvv/web check-all` passes
- [ ] GA4 only fires in production (or when `NEXT_PUBLIC_GTM_ID` is set)

### Phase 1 — Responsibility finder events

- [ ] All 9 events from the responsibility finder taxonomy table instrumented in `ResponsibilityFinder.tsx` and `ResultCard`
- [ ] Dwell-time tracking: `useEffect` timer starts when `ResultCard` mounts, fires `responsibility_dwell` at 5s, 15s, 30s thresholds
- [ ] Abandon tracking: fires when user navigates away (route change or component unmount) without having clicked contact/organigram
- [ ] `trackEvent` calls are non-blocking and never throw
- [ ] No PII in events — no email addresses, phone numbers, or user names in parameters
- [ ] Events verified in GTM debug preview
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 — Search events

- [ ] All 5 events from the search taxonomy table instrumented in `SearchInterface`, `SearchForm`, `SearchResults`
- [ ] `search_submitted` fires on form submit, not on every keystroke
- [ ] `search_result_clicked` includes 1-indexed position for click-through-rate analysis
- [ ] No PII in events
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3 — Organigram events

- [ ] All 5 events from the organigram taxonomy table instrumented in `UnifiedOrganigramClient` and sub-components
- [ ] View change tracking includes source (tab click vs. swipe vs. keyboard)
- [ ] No PII in events
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 7. Manual Prerequisites (not code — done by project owner)

1. Create a Google Analytics 4 property at [analytics.google.com](https://analytics.google.com)
2. Create a GTM container at [tagmanager.google.com](https://tagmanager.google.com)
3. In GTM: add a GA4 Configuration tag with the Measurement ID
4. In GTM: add GA4 Event tags for each custom event (can be done incrementally per phase)
5. Set `NEXT_PUBLIC_GTM_ID` in Vercel environment variables (production only)

## 8. GTM Architecture — Catch-All Pattern

All KCVV custom events share a single trigger + tag pair instead of per-feature
triggers. This keeps the GTM workspace manageable as new features are added.

### Trigger: `Custom Event — KCVV Analytics`

| Field              | Value                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger type       | Custom Event                                                                                                                                |
| Event name (regex) | `responsibility_\|search_\|organigram_\|related_content_\|homepage_\|directions_\|firstteam_strip_\|article_\|related_article_\|event_cta_` |
| Use regex matching | checked                                                                                                                                     |
| Fires on           | All Custom Events                                                                                                                           |

### Tag: `GA4 Event — KCVV Custom Events`

| Field      | Value                                                         |
| ---------- | ------------------------------------------------------------- |
| Tag type   | Google Analytics: GA4 Event                                   |
| Event Name | `{{Event}}` (built-in variable — resolves to the exact event) |
| Parameters | All `dlv - *` variables mapped by snake_case name             |

### When a new feature adds events

1. Pick a unique `snake_case` prefix for the feature (e.g., `firstteam_strip_`)
2. Add the prefix to the trigger regex (append `\|newprefix_`)
3. If the events use **new** parameters not yet in the DLV list, create new
   Data Layer Variables (`dlv - param_name`) and add them to the tag's
   Event Parameters
4. If the parameters are **new** to GA4, register them as custom dimensions
   (Admin → Data display → Custom definitions)
5. Test with GTM Preview + GA4 DebugView, then publish

## 9. Open Questions

- `[ ]` **Dwell-time thresholds**: 5s/15s/30s proposed for responsibility finder. Are these reasonable or should we start with just one threshold (e.g., 10s)?
- `[ ]` **`responsibility_abandon` definition**: Fire on route change only, or also on browser back/tab close? `beforeunload` is unreliable — consider only tracking in-app navigation.
- `[ ]` **#430 (responsibility analytics)**: This existing issue defines 4 GA4 events that overlap with Phase 1. Close #430 as superseded by this PRD, or keep it as a reminder to configure the corresponding GTM tags?

## 10. Discovered Unknowns

_Filled during implementation._
