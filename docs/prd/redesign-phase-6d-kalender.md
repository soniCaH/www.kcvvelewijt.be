# PRD: Redesign Phase 6.D — Kalender (`/kalender`)

**Status**: Draft — data layer ready; **presentation A/B unresolved** (see §7)
**Date**: 2026-06-03
**Design contract**: _none yet_ — produced in **Phase 3** (`docs/design/mockups/phase-6-kalender/`, rounds `6d0`–`6dN`). Direction input: `docs/plans/2026-04-27-redesign-master-design.md` §6.6 + the 2026-05-28 direction-lock grill.
**Epic**: #1528 (Redesign Phase 6) · **Milestone**: `redesign-retro-terrace-fanzine`

---

## 1. Problem statement

`/kalender` is the last un-redesigned route in Phase 6. Today it renders a pre-redesign green
`<InteriorPageHero>` + the legacy `<CalendarWidget>` (month/week views, day-dots, an iCal subscribe
panel) and filters **by team**. Two gaps make it inconsistent with the rest of the redesigned site:
(1) it shows only PSD matches + standalone `event` docs — the `articleType:event` articles that 6.E
folded into `/evenementen` never appear, so the same club activity surfaces in one place but not the
other; and (2) it filters by _team_, whereas every other event surface (and the master plan §6.6)
now scans **by type** — Wedstrijden vs Clubevent vs Supportersactiviteit vs Jeugdwerking vs Andere.
The redesign brings `/kalender` onto the retro-terrace-fanzine language, consumes 6.E's unified feed
(extended to a third source), and swaps the filter axis from team to type.

## 2. Scope

**In scope (packages):** `apps/web` only.

**In scope (work):**

- **Data layer (direction-agnostic):** a 3-source unified calendar feed — PSD matches + `event` docs
  - `articleType:event` articles — fronted by a discriminated `CalendarFeedItem` view-model with a
    single `kalenderType` filter facet (`Wedstrijden` ∪ the 4 `eventType` values).
- **Filter axis swap:** replace the by-team page filter with by-**type** `<FilterTabs>`
  (`Wedstrijden · Clubevent · Supportersactiviteit · Jeugdwerking · Andere`).
- **Presentation redesign:** the chosen 6.D.d1 direction (reskin the widget **or** rebuild to the
  §6.6 newspaper agenda — see §7), in retro-terrace-fanzine language, with Storybook + VR + states.
- **iCal subscribe panel:** retained as a distinct "follow your team's matches" feed (orthogonal to
  the type filter); reskinned to match the chosen direction.
- Analytics (`kalender_*` taxonomy), SEO/metadata refresh, optional `ItemList` JSON-LD.

**OUT of scope (name it):**

- **The A/B direction decision is NOT made in this PRD.** Reskin-vs-rebuild is resolved at Phase 3
  with side-by-side mockups per the owner's standing instruction. Phases 4+ are intentionally
  provisional until that lock.
- **Any `apps/api` / `packages/api-contract` change.** Matches already flow via the existing BFF
  `Match` type + `BffService.getMatches`; events are Sanity-native via `EventRepository`. The
  `CalendarFeedItem` VM is composed in `apps/web` — no new endpoint, no contract type.
- **Any schema change.** `eventType` + `location` already shipped in 6.E on both `event` and
  `eventFact`. No new fields.
- **Adding events to the iCal _subscribe_ feed.** `/api/calendar.ics` stays matches-only; per-event
  "Zet in agenda" already exists (`buildEventIcs`, used by `/evenementen/[slug]`) and is not rebuilt.
- **RSVP / ticketing / "training" as a filter facet** (no standalone training data source — dropped
  from the master-plan §6.6 wording on purpose).
- **Route rename or new route.** `/kalender` stays; no 301s.

## 3. Tracer bullet

**`articleType:event` articles appear on the live `/kalender` alongside matches and `event` docs —
nothing else changes.** Switch the page's event source from `eventRepo.findAll()` (event-docs only)
to `eventRepo.findUpcomingForList()` (the 6.E merged event-docs + event-articles feed), map the
`source: "article"` rows into the existing `CalendarEvent[]` the widget already renders, and verify
an event-article now shows on a calendar day. No `CalendarFeedItem` type yet, no filter swap, no
redesign. This proves the 6.E feed is consumable by the calendar end-to-end (Sanity 2× GROQ →
`mergeEventFeed` → page → `<CalendarWidget>`) before any data-model or visual work — and it is the
exact switch the 6.E author flagged in the `findUpcomingForList` doc comment.

## 4. Phases

```text
Phase 1: Tracer — /kalender consumes the 3-source feed (event-articles now appear)        → #1991 [tracer-bullet · ready]
Phase 2: CalendarFeedItem unified VM + by-TYPE FilterTabs replaces by-team filter          → #1992 [ready · blocked-by #1991]
Phase 3: DESIGN GATE — 6d0 data-reality audit + 6d1 reskin-vs-agenda A/B → lock + drills    → #1993 [ready · design · owner-gated · blocked-by #1992]
Phase 4: Build the locked presentation + per-component primitives + states                  → #1994 [provisional · blocked-by #1993]
Phase 5: iCal reskin + analytics + SEO/JSON-LD + retire/keep legacy + VR baselines           → #1995 [provisional · blocked-by #1994]
```

> Issues cut 2026-06-03 in milestone `redesign-retro-terrace-fanzine` (#51). Phases 1–3 are
> `ready`; Phases 4–5 are created for tracking only and gain `ready` once #1993 re-specs them.

Phases 1–2 are **direction-agnostic** and can proceed immediately — both A/B outcomes consume the
same feed + filter axis. Phase 3 is a **design phase** (mockups + drill cadence + owner lock), not a
build issue; it gates Phases 4–5, whose acceptance criteria below are deliberately provisional and
will be rewritten against the locked design contract.

## 5. Acceptance criteria per phase

### Phase 1 — Tracer (direction-agnostic)

- [ ] `/kalender` page fetch uses `eventRepo.findUpcomingForList()` (not `findAll()`); the
      `source: "article"` rows are mapped into the rendered event stream with `href` → `/nieuws/[slug]`.
- [ ] An upcoming `articleType:event` article (seeded on staging) renders on its calendar day and
      links to `/nieuws/[slug]`; standalone `event` docs still link to `/evenementen/[slug]`.
- [ ] Graceful degradation preserved — a Sanity failure still yields an empty event list, not a crash
      (existing `Effect.catchAll` on the event fetch retained).
- [ ] `/kalender` e2e smoke test (`apps/web/test/e2e/routes.spec.ts`) stays green.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 2 — Unified VM + by-type filter (direction-agnostic)

- [ ] A `CalendarFeedItem` discriminated union (`source: "match" | "event" | "article"`) carries a
      `kalenderType` facet: matches → `"Wedstrijden"`; events/articles → their `eventType`
      (null → `"Andere"`, reusing `DEFAULT_EVENT_TYPE`).
- [ ] A single merge composes BFF matches + `findUpcomingForList()` into one chronological
      `CalendarFeedItem[]`; unit-tested for ordering + per-source `href` + `kalenderType` mapping.
- [ ] `<FilterTabs>` replaces the by-team filter with the locked set
      `Wedstrijden · Clubevent · Supportersactiviteit · Jeugdwerking · Andere` (+ an "Alles" default);
      filtering narrows the rendered feed by `kalenderType`. URL param swaps `?team=` → `?type=`.
- [ ] Reselecting the active tab is a no-op (dedup guard — no duplicate `kalender_filter` event).
- [ ] Empty + filtered-to-zero states render (no blank widget).
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 3 — Design gate (no build) — ✅ LOCKED 2026-06-05 (#1993)

Lock doc: `docs/design/mockups/phase-6-kalender/6d-kalender-locked.md`.

- [x] `6d0` data-reality audit committed (`…/6d0-data-reality-audit.md`).
- [x] `6d1` side-by-side mockups produced — **owner picked: ship BOTH presentations, user-toggled,
      grid default** (not A-or-B, not auto-by-filter). Recorded in the lock doc.
- [x] Per-component drills locked: `6d2` agenda dense-day = **labelled wall** (show all, day-count
      header, events tinted) · `6d3` grid cell = **events-on-top titles + match pips, no badge** ·
      `6d4` agenda is **month-windowed** (shares the grid's period nav; not whole-season, not flat
      upcoming). Filter = #1992 colour chips + **Wedstrijden = card-red** (confirmed).
- [x] Lock doc committed; §7 + Phases 4–5 rewritten below; master-plan §6.6 status note updated.

### Phase 4 — Build the locked presentation (#1994)

- [ ] **3-way view toggle** — Maand (grid · **default**) / Week (grid) / Agenda (list),
      `?view=month|week|agenda`; the month/week period nav is **shared across all three views**.
- [ ] **Agenda view** — new `<CalendarAgenda>` (`Features/Calendar/*`): the current-month-windowed
      labelled-wall list — `<EditorialHeading>` month header + day groups (count sub-header +
      `<DashedDivider>`) + match/event rows reusing the 6.C `<TeamAgendaRow>` vocabulary +
      `<TicketStub>`/`<MonoLabel>` type tags; **event rows tinted** so a dense day never buries them.
- [ ] **Grid reskin** (`<CalendarMonth>`/`<CalendarWeek>`) — 6d3 cell: events-on-top full-width
      titles + match pips (filled = thuis, ring = uit), **no count badge**; paper/ink chrome.
      Selected-day detail reuses the 6.C `<TeamAgendaRow>` scoreboard + outcome colour
      (win = jersey-deep / draw = none / loss = brick).
- [ ] Drop the legacy bottom dot-legend — the colour chips are the legend.
- [ ] New sub-components ship `Features/Calendar/*` Storybook stories + unit tests.
- [ ] **VR adoption for the whole kalender surface** — `<KalenderFilterBar>` (deferred from #1992),
      the reskinned grid, and `<CalendarAgenda>` get the `vr` tag + committed Docker baselines.
- [ ] States covered: empty feed, filtered-to-zero, loading skeleton, dense day (10-match Saturday),
      2-event day.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### Phase 5 — iCal + analytics + SEO + cleanup (#1995)

- [ ] `<CalendarSubscribePanel>` reskinned (paper/ink + chip vocabulary), retained as a matches-only
      "follow your team" feed; `/api/calendar.ics` unchanged.
- [ ] `kalender_*` analytics fire (taxonomy §9) — incl. **`kalender_view_toggle`** (Maand/Week/Agenda
      switch — the §9 "A/B-dependent" caveat now resolves to **yes**) + `kalender_view` page-view.
      `kalender_` appended to the live GTM trigger RegEx (manual step, PR body); the `kalender_type`
      GA4-dimension decision (reuse `event_type` vs register new) made + DLVs/params mapped.
- [ ] Metadata refreshed; optional `ItemList` JSON-LD of the **current window's** items validated.
- [ ] Legacy `<CalendarWidget>` children retired or absorbed per the lock; orphaned compact-match
      components reconciled (coordinate with #1960).
- [ ] CI `visual-regression` + e2e green; `pnpm --filter @kcvv/web check-all` passes.

## 6. Effect Schema / api-contract changes

**None.** No `packages/api-contract` type, no HttpApi endpoint, no Sanity schema delta — `eventType`

- `location` already exist (6.E), matches already flow via the BFF `Match` type. The only new type is
  an `apps/web` view-model, `CalendarFeedItem`, composed from `Match` (api-contract) + `EventListItemVM`
  (`apps/web/src/lib/repositories/event.repository.ts`). It lives alongside the existing
  `CalendarMatch` / `CalendarEvent` VMs in the kalender route's `utils.ts` (or a sibling module) — the
  same Sanity-native, apps/web-only posture 6.E took.

## 7. Open questions — ✅ RESOLVED at the Phase 3 gate (#1993, 2026-06-05)

All headline questions are answered in `docs/design/mockups/phase-6-kalender/6d-kalender-locked.md`.

- `[x]` **Reskin vs rebuild** → **ship BOTH**, behind a user-driven 3-way view toggle
  (Maand grid · **default** / Week grid / Agenda list). Not A-or-B; not an auto-by-filter switch.
- `[x]` **Dense month-cell match rendering** → 6d3 cell: events-on-top full-width titles + match
  pips (filled = thuis, ring = uit), **no count badge**; full scoreboard on day-click reuses the
  6.C `<TeamAgendaRow>`. Agenda dense-day (6d2) = **labelled wall** (show all, day-count header,
  events tinted).
- `[x]` **Filter component + `Wedstrijden` colour** → reuse `/evenementen`'s colour-chip vocabulary
  (`<KalenderFilterBar>`, `EVENT_CHIP_BASE` + `EVENT_TYPE_FILL`), **not** `<FilterTabs>`;
  **Wedstrijden = `card-red`**. Shipped #1992, confirmed here. The chip row is the legend (the
  legacy bottom dot-legend is dropped).
- `[x]` **iCal subscribe stays matches-only** → yes; retained + reskinned, orthogonal to the type
  filter.
- `[x]` **Past/archive scope** → the Agenda is **month-windowed** and shares the grid's period nav
  (`‹ Month ›`); page back/forward by month in any view. **Not** whole-season (≈1000 matches at
  kickoff) and **not** flat upcoming-only. Past months simply carry played results (matches are
  full-season) and no events (events are upcoming-only by data).

## 8. Discovered unknowns (filled during implementation)

```text
- (none yet)
```

## 9. Analytics

New `kalender_` event prefix — **must be appended to the live GTM Custom Event trigger RegEx**
(currently ends `…|player_|match_|team_`) before any of these reach GA4. Single source of truth; keep
byte-identical to the deployed trigger.

| Event                     | Trigger                                                                   | Parameters                                | Phase             |
| ------------------------- | ------------------------------------------------------------------------- | ----------------------------------------- | ----------------- |
| `kalender_view`           | page mount (`<PageViewTracker>`)                                          | —                                         | 5 (P2 ok)         |
| `kalender_filter`         | type tab change (dedup-guarded)                                           | `kalender_type` (`Wedstrijden`/eventType) | 2                 |
| `kalender_item_click`     | click a feed item through to detail                                       | `source` (`match`/`event`/`article`)      | 5                 |
| `kalender_subscribe_open` | open iCal subscribe panel                                                 | —                                         | 5                 |
| `kalender_subscribe_copy` | copy/QR the webcal feed                                                   | `teams_count`, `side`                     | 5                 |
| `kalender_view_toggle`    | month/week (or other) view switch — **only if the reskin direction wins** | `view`                                    | 5 (A/B-dependent) |

- New params (`kalender_type`, `source`, `view`, `teams_count`, `side`) need GA4 DLVs + Event-tag
  parameter mappings; `event_type` (existing from `event_filter`) ≠ `kalender_type` — register
  separately or reuse deliberately (owner call at Phase 5).
- No PII — items carry public titles/slugs only; no member IDs.
- GA4 exploration: add/extend a "Kalender engagement" funnel (`kalender_view` → `kalender_filter` →
  `kalender_item_click`).

## 10. SEO & structured data

- `/kalender` keeps `generateMetadata` (title/description/OG already present); refresh copy if the
  hero changes at Phase 4.
- **Optional `ItemList` JSON-LD** of upcoming feed items (each linking to its detail route) via a new
  builder in `src/lib/seo/jsonld.ts`. Individual `Event` JSON-LD already lives on
  `/evenementen/[slug]`; do not duplicate per-item Event schema on the index. Validate with the
  Schema.org validator if added.
- No new route → no sitemap change; the existing `/kalender` smoke e2e remains the page-level guard.

---

## Appendix — current-state reference (for implementers)

| Concern                | Location                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Route + server fetch   | `apps/web/src/app/(main)/kalender/page.tsx` (`fetchCalendarData`)                                                    |
| Kalender view-models   | `apps/web/src/app/(main)/kalender/utils.ts` (`CalendarMatch`/`CalendarEvent`/`CalendarTeamInfo`)                     |
| Widget shell + filter  | `apps/web/src/components/calendar/CalendarWidget/` (by-team filter, view toggle, subscribe toggle)                   |
| Month / week views     | `apps/web/src/components/calendar/CalendarMonth/`, `…/CalendarWeek/`                                                 |
| iCal subscribe panel   | `apps/web/src/components/calendar/CalendarSubscribePanel/`                                                           |
| Matches-only iCal feed | `apps/web/src/lib/utils/ical.ts` (`generateIcal`) + `apps/web/src/app/api/calendar.ics/route.ts`                     |
| Per-event iCal         | `apps/web/src/lib/utils/event-ics.ts` (`buildEventIcs`) — not used by /kalender                                      |
| 6.E merged feed        | `apps/web/src/lib/repositories/event.repository.ts` — `findUpcomingForList()`, `mergeEventFeed()`, `EventListItemVM` |
| eventType styling      | `apps/web/src/components/event/.../event-type-style.ts` (`EVENT_TYPE_FILL`, `DEFAULT_EVENT_TYPE`)                    |
| FilterTabs             | `apps/web/src/components/design-system/FilterTabs/` (no icon prop)                                                   |
| /evenementen filter    | `apps/web/src/components/event/EventFilterBar/` (custom colour chips)                                                |
| Master-plan direction  | `docs/plans/2026-04-27-redesign-master-design.md` §6.6                                                               |
