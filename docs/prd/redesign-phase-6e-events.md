# PRD: Redesign Phase 6.E — Events (`/evenementen`)

**Status**: Ready for implementation (design locked)
**Date**: 2026-06-02
**Design contract**: `docs/design/mockups/phase-6-events/6e-design-summary-locked.md` (rounds `6e1`–`6e5`)
**Epic**: #1528 (Redesign Phase 6) · **Milestone**: `redesign-retro-terrace-fanzine`

---

## 1. Problem statement

The events surface is the last un-redesigned route in Phase 6. Today `/events` renders a
pre-redesign green hero + grey card grid (`<EventsList>` / `<EventCard>`), the detail route
`(main)/events/[slug]` is a legacy CTA page, and the `event` schema has no way to categorise an
event (no type) or state where it happens (no `location`). The redesign needs an events index that
reads like a club's "wat is er te doen" poster wall and a calm detail page — both in the
retro-terrace-fanzine language — plus the schema fields to drive type-based scanning.

## 2. Scope

**In scope (packages):** `packages/sanity-schemas`, `apps/web`, `apps/studio` + `apps/studio-staging`
(schema consumed by both).

**In scope (work):**

- Schema deltas: `location` + `eventType` enum on `event`; `eventType` on `eventFact`.
- New `<TicketStub>` and `<EventHero>` components (+ Storybook, tests, VR).
- `/evenementen` list (single-column, month-grouped, colour-coded filter chips) + `/evenementen/[slug]`
  editorial detail (CTAs + iCal + "Andere events").
- Merge `articleType:event` articles into the list feed.
- Route rename `/events` → `/evenementen` with **301** redirects; sitemap + SEO updates.
- States (empty / filtered-to-zero / multi-day / time-less / no-cover) + analytics.
- Retire legacy `<EventCard>` / `<EventsList>` / old `/events` route.

**OUT of scope (name it):**

- `/kalender` (the 3-source feed _including PSD matches_) — separate surface (§6.6), Phase 6.D.
- Any `apps/api` / `packages/api-contract` change — events are **Sanity-native**, read via
  `EventRepository` GROQ. The BFF is not touched.
- RSVP, ticketing/payment, body Portable Text on the detail page, sponsor/credit footer (dropped per §6.7).
- Adding `eventFact`'s richer fields (`capacity`, `sessions`, `ageGroup`, …) to the root `event` doc.

## 3. Tracer bullet

**One real upcoming event rendered as a bare `<TicketStub>` at the new `/evenementen` route, end to
end.** Crosses every layer: `event` schema gains `location` + `eventType` → `sanity typegen`
regenerates `sanity.types.ts` → `EVENTS_QUERY` extended (upcoming-only + new fields) →
`EventRepository.findAll` → new `/evenementen` page renders a minimal type-coloured ticket list →
`/events` 301s to `/evenementen`. No month grouping, no filters, no detail rebuild, no design polish.
Proves the schema→typegen→GROQ→route→component chain and the redirect before any styling.

## 4. Phases

```text
Phase 1: Tracer — event schema delta + /evenementen route + bare <TicketStub> list + 301   (always first)
Phase 2: <TicketStub> finalised + month-grouped list shell
Phase 3: Filter bar (colour chips = legend) + empty / filtered-to-zero states
Phase 4: <EventHero> + /evenementen/[slug] editorial detail + iCal + "Andere events" + detail states
Phase 5: Merged feed — eventType on eventFact + articleType:event articles in the list
Phase 6: SEO / sitemap / analytics / JSON-LD + retire legacy + VR baselines
```

## 5. Acceptance criteria per phase

### Phase 1 — Tracer bullet

- [ ] `event` schema gains `location` (string, optional) and `eventType` (string enum:
      `Clubevent` | `Supportersactiviteit` | `Jeugdwerking` | `Andere`, optional in v1) in
      `packages/sanity-schemas/src/event.ts`; both studios pick it up.
- [ ] `pnpm --filter @kcvv/studio typegen` (or the repo typegen script) re-run; `sanity.types.ts` updated.
- [ ] `EVENTS_QUERY` extended to project `location`, `eventType` and filter **upcoming-only**
      (`coalesce(dateEnd, dateStart) >= now()`), keeping `order(dateStart asc)`.
- [ ] New route `apps/web/src/app/.../evenementen/page.tsx` renders `EventRepository.findAll()` as a
      minimal list of `<TicketStub>` (type-coloured date block + pill + title + location). No grouping/filters.
- [ ] `/events` and `/events/[slug]` issue **301** redirects to `/evenementen` (+ `/evenementen/[slug]`).
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 2 — `<TicketStub>` + month-grouped list shell

- [ ] `<TicketStub>` finalised: whole-card link → `/evenementen/[slug]`; type-coloured tear-off date
      block (Clubevent=jersey-deep · Supporters=warm · Jeugd=jersey-bright · Andere=ink), dashed
      divider (no punch-holes); body = `eventType` pill + display-serif title + mono `time · location`.
- [ ] Hover/focus-visible: `group-hover:scale-[1.02] group-hover:-rotate-1` + "Meer details →" reveal
      (`opacity-0 → group-hover:opacity-100`), with `motion-reduce` resets — mirrors `<EditorialHero>`.
- [ ] `eventType` is conveyed by both colour **and** the text pill (WCAG 1.4.1).
- [ ] List renders single column, **grouped by month** (`<StripedSeam>` header + display-serif month
      name); year shown only when crossing into the next calendar year.
- [ ] Storybook stories: each `eventType` colour, hover state, multi-day, no-time. Unit test: link href,
      reveal present, reduced-motion class.
- [ ] VR baselines committed for `<TicketStub>` states (same PR).
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 3 — Filter bar + empty states

- [ ] Colour-coded filter chips (Alles + 4 types) that **double as the legend** (no separate legend);
      selected = filled, unselected = dimmed outline; **single-select**, "Alles" default.
- [ ] Filtering hides any month whose tickets are all filtered out (no empty month headers).
- [ ] Empty list state (no upcoming events): centred message, no filter row / month headers.
- [ ] Filtered-to-zero state: per-type message + "Toon alles" reset.
- [ ] `event_filter` analytics fires with `event_type`; GTM tag + GA4 report updated.
- [ ] Storybook: filter row (each selected state), empty, filtered-zero. VR baselines committed.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 4 — `<EventHero>` + detail page

- [ ] New `<EventHero>` (editorial cream, centred): `eventType` pill · mono full-date/location kicker ·
      display-serif title w/ italic jersey-deep emphasis · location line · centred CTAs · `<TapedFigure>`
      cover (tilted+taped) **only when `coverImage` set**.
- [ ] `/evenementen/[slug]` rebuilt with `<EventHero>` from `EVENT_BY_SLUG_QUERY` (extended with
      `location`, `eventType`).
- [ ] **Reserveer ↗** CTA renders only when `externalLink.url` set (label = `externalLink.label`,
      fallback "Reserveer"); opens in new tab.
- [ ] **＋ Zet in agenda** CTA always present; downloads a valid `.ics` (VEVENT with title, start, end,
      location, description) — client-side blob.
- [ ] "Andere events" section: `<StripedSeam>` heading + `<TicketStub>` grid of other upcoming events
      (current excluded); hidden when none.
- [ ] States: multi-day (start day on stub, range in kicker), time-less (`00:00` → omit time), no-cover
      (omit figure).
- [ ] `event_view` + `event_cta_click` (`cta: reserveer | agenda`) analytics fire; GTM + GA4 updated.
- [ ] JSON-LD `SportsEvent`/`Event` emitted on the detail page (reuse existing builder if suitable).
- [ ] Storybook (`<EventHero>` w/ + w/o cover, w/ + w/o externalLink, multi-day) + e2e smoke. VR baselines.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 5 — Merged feed (articleType:event)

- [ ] `eventType` enum added to the `eventFact` block schema (both studios) + typegen re-run.
- [ ] List query merges `event` docs **and** `article` docs where `articleType == "event"` (date from the
      `eventFact` block), upcoming-only, into one chronological, month-grouped, type-filterable feed.
- [ ] Article-sourced tickets link to the **article** (`/nieuws/[slug]`); event-doc tickets link to
      `/evenementen/[slug]`. Both render via `<TicketStub>`.
- [ ] Filters apply across both sources; sort is by event date across the merged set.
- [ ] Tests cover the merge + ordering + per-source link target. `pnpm --filter @kcvv/web check-all` passes.

### Phase 6 — SEO / analytics / legacy retirement

- [ ] Sitemap updated to `/evenementen` + `/evenementen/[slug]` (drop `/events`); OG image from
      `coverImage`/`ogImage`.
- [ ] Legacy `<EventCard>` / `<EventsList>` and the old `(landing)/events` + `(main)/events/[slug]`
      routes retired once `/evenementen` fully replaces them (redirects kept).
- [ ] VR Phase-4 page fixtures cover `/evenementen` (list, filtered, empty) + one `/evenementen/[slug]`.
- [ ] Playwright e2e: list renders, filter narrows, ticket → detail, CTAs present.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

## 6. Effect Schema / api-contract changes

**None in `packages/api-contract` or `apps/api`.** Events are Sanity-native and read through
`EventRepository` (`apps/web/src/lib/repositories/event.repository.ts`) via GROQ + `@sanity/cli`
typegen. Changes are confined to:

- **Sanity schema** (`packages/sanity-schemas/src/event.ts`, `eventFact.ts`) — new fields.
- **GROQ + typegen** — `EVENTS_QUERY`, `EVENT_BY_SLUG_QUERY` extended; `sanity.types.ts` regenerated;
  `EventVM` / `EventDetailVM` re-derived.

## 7. Open questions

- `[ ]` **`address` on the detail page** — root `event` has `location` only (no `address`; that lives on
  `eventFact`). Recommendation: **`location`-only** for event docs; do not add `address` to the `event`
  delta. — owner confirm; default to location-only if no objection.
- `[ ]` **`eventType` required vs optional** — optional in v1 (existing events have none) with an "Andere"
  fallback at render time, or a one-off migration to backfill? — decide before Phase 1 ships; default
  optional + render-time fallback.
- `[ ]` **iCal generation** — client-side `.ics` blob (recommended, no BFF) vs a BFF endpoint. — resolved
  in Phase 4; default client-side.
- `[ ]` **Multi-select filters** — single-select locked for v1; revisit only if owner wants combinations.
- `[ ]` **Dutch empty-state copy** — proposed: _"Geen evenementen gepland — kom snel terug."_ /
  _"Geen [type] gepland."_ — owner to confirm final strings.
- `[ ]` **Article-sourced ticket link target** (Phase 5) — confirmed `/nieuws/[slug]` for `articleType:event`
  articles vs a synthetic event page — assumed `/nieuws/[slug]`.

## 8. Discovered unknowns

_Filled during implementation._
