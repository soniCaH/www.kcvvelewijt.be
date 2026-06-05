# 6.D Kalender — `6d0` Data-Reality Audit

**Issue:** #1993 (Phase 6.D design gate) · **PRD:** `docs/prd/redesign-phase-6d-kalender.md`
**Purpose:** Establish what the calendar actually renders — per-source row data + real
volume/density — so the `6d1` reskin-vs-agenda A/B is decided against reality, not the
master-plan §6.6 sketch (which was drafted picturing a sparse events agenda).

Audit only — no design decisions here. Decisions land in `6d1`+ and the lock doc.

---

## 1. The feed (post-#1991/#1992)

`/kalender` renders one `CalendarFeedItem[]` (`apps/web/src/app/(main)/kalender/utils.ts`,
`buildCalendarFeed`) — a discriminated union over `source`, each row carrying a single
`kalenderType` facet (`"Wedstrijden" | EventType`) and an ISO `dateStart`:

| `source`  | Origin                         | Detail link            | `kalenderType`            |
| --------- | ------------------------------ | ---------------------- | ------------------------- |
| `match`   | PSD via BFF (`getMatches`)     | `/wedstrijd/[matchId]` | `"Wedstrijden"`           |
| `event`   | Sanity `event` doc             | `/evenementen/[slug]`  | `eventType` (→ `Andere`)  |
| `article` | Sanity `articleType:event`     | `/nieuws/[slug]`       | `eventType` (→ `Andere`)  |

## 2. What each source provides for a calendar row

### 2.1 Match (`CalendarMatch`) — the rich, structured row

`id` · `date` (ISO) · `time` (`HH:mm`) · `homeTeam`/`awayTeam` `{ id, name, logo? }` ·
`homeScore`/`awayScore` · `scoreDisplay` (`vs` | `score`) · `status`
(`scheduled`/`finished`/…) · `competition` (e.g. "2e Provinciale") · `team`
(`kcvv_team_label` — "A-ploeg", "U15 A") · `isHome`.

- A match row wants **two crests + a score/VS + a time + the KCVV team label + home/away**.
  This is a *two-sided scoreboard*, not a one-line title. The 6.B/6.C work already locked
  this vocabulary (`<MatchHero>`, `<TeamAgendaRow>`: symmetric desktop / KCVV-centric mobile;
  outcome colour win=jersey-deep / draw=none / loss=brick).
- `status` distinguishes upcoming (VS + time) from played (score). A calendar spanning the
  season holds **both** past results and future fixtures.

### 2.2 Event / article (`CalendarEvent` + `kalenderType`) — the sparse, editorial row

`id` · `title` (one display string) · `href` · `dateStart` · `dateEnd?` (multi-day) ·
`kalenderType` (the colour facet) · `location` (on the source VM; not currently surfaced
by the widget). No crests, no score — a **single-line title + type tag + optional location**.
This is exactly the master-plan §6.6 agenda row shape.

## 3. Volume & density — the decisive finding

The calendar is **match-dominated by volume, event-sparse**, and matches **cluster onto
two weekend days**:

- **Teams:** the page queries every Sanity `team` with a `psdId` (A + B + the full youth
  ladder U6→U21 across Bovenbouw/Middenbouw/Onderbouw) — on the order of **~15–20 teams**,
  each with a full-season fixture list. (Exact count is season-dependent; the design must not
  assume a small N.)
- **Weekend clustering:** youth play **Saturday**, seniors **Sunday**. A single in-season
  **Saturday can carry ~10–15 match rows**; a weekend ~15–20. Weekdays are mostly empty.
- **Events:** a handful **per month** (spaghetti-avond, tornooi, quiz). Event-articles rarer
  still. Across a whole month, events + articles together are typically **single digits**.

> **Implication for `6d1`:** the master-plan §6.6 "tabular month agenda" was sketched for the
> sparse *events* surface. Applied to the real feed, a flat chronological agenda renders a
> **wall of ~10–15 near-identical match rows on every Saturday**, with the occasional event
> lost among them. The existing month **grid** absorbs density natively (a day-cell shows N
> dots / a count, detail-on-select). So the A/B is not merely cosmetic — it is **"can the
> agenda form survive match density?"** vs **"can the grid form carry the fanzine voice?"**.
> Any agenda direction (B) must answer dense-Saturday grouping (by team-order? collapsed
> "N wedstrijden" header? time-buckets?); any grid direction (A) must answer how a fanzine
> day-cell shows 10+ items without becoming dot-soup.

## 4. Type mix vs the filter

By-type filter facets (locked #1992): **Wedstrijden · Clubevent · Supportersactiviteit ·
Jeugdwerking · Andere** (+ Alles). Realistic distribution: **Wedstrijden** is ~95%+ of rows;
the four event types share the sparse remainder. So:

- The **default ("Alles") view is dominated by matches**; selecting an event type collapses
  the calendar to a near-empty set (→ the filtered-to-zero state ships in #1992 already).
- A **"Wedstrijden"-off** view (events only) is the sparse case the §6.6 agenda fits best —
  worth noting the agenda form shines precisely when matches are filtered out.

## 5. Past / archive reality

The feed today is **upcoming-leaning** for events (`findUpcomingForList` is upcoming-only),
but **matches are full-season** (BFF `getMatches` returns played + scheduled). The current
widget is month-navigable into the past (you can page back to a played month and see scores).
The agenda form (B) is naturally "from now forward"; preserving past-month browsing is a
direction-dependent open question (carried into `6d1`).

## 6. Inputs the A/B must carry

1. **Density is the gating constraint** (§3) — both directions must show a realistic dense
   Saturday, not a tidy 3-row month.
2. **Match row = two-sided scoreboard** (§2.1), reusing 6.B/6.C vocabulary — not a §6.6
   one-line title row. Event row = §6.6 one-line title + type tag (§2.2).
3. **Carry #1992 locks:** by-type **colour chips** (reusing `EventFilterBar` vocabulary) +
   **Wedstrijden = card-red**; `?type=` filter; dedup-guarded `kalender_filter`.
4. **iCal subscribe** panel is retained (matches-only team feed, orthogonal to the type
   filter) — reskinned in the chosen direction.
5. **Outcome colour** (win=jersey-deep / draw=none / loss=brick) is already locked for
   matches+standings (6.C) — reuse, don't reinvent.
