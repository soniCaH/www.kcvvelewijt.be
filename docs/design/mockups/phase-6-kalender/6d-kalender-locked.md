# Phase 6.D — `/kalender` design lock

**Issue:** #1993 (design gate) · **PRD:** `docs/prd/redesign-phase-6d-kalender.md`
**Status:** LOCKED 2026-06-05 (drilled with owner, rounds 6d1–6d4). Supersedes the parked
A/B in master-plan §6.6. Build phases (#1994/#1995) take their final ACs from here.

Drill artefacts (this dir): `6d0-data-reality-audit.md` · `6d1-reskin-vs-agenda-compare.html`
· `6d2-agenda-density-compare.html` · `6d3-grid-cell-compare.html`.

---

## The headline decision (6d1)

**Ship BOTH presentations behind a user-driven view toggle — grid is the default.** Not an
auto-by-filter switch (rejected), not one-or-the-other. The widget's existing `Maand / Week`
segmented control extends to a **3-way view toggle**:

| View       | Form                       | Default | URL            |
| ---------- | -------------------------- | ------- | -------------- |
| **Maand**  | month **grid** (reskinned) | ✅ yes  | `?view=month`  |
| **Week**   | week **grid** (reskinned)  | —       | `?view=week`   |
| **Agenda** | month **list** (newspaper) | —       | `?view=agenda` |

**Owner quote:** _"I want both, with a tab or something to switch. Grid as default."_

## Shared period window (6d4)

**All three views render the SAME navigated window** — the `‹ September '26 ›` month nav
(and the week nav in Week view) is shared state, not per-view. Switching Maand↔Agenda keeps
the current month; `‹ ›` pages months.

- **Agenda is month-windowed** — it shows exactly the current month's items as a list, then
  pages by month. **Never the whole season** (~1000 matches at kickoff) and **never a flat
  "all upcoming" feed.** Owner: _"only if it is also filtered like the grid (per month/week)…
  Dont want to show the entire season (neither upcoming-only)."_
- Past browsing is native to all views via the shared month nav (matches are full-season;
  events are upcoming-only by data, so past months simply carry no events).

## Grid cell — dense-day treatment (6d3 → v2)

A month-cell renders, top to bottom:

1. **Events first** — each as a **full-width italic display title** + a type-colour dot
   (`•`). They stack when a day has 2+. Events are rare + high-value, so they never hide.
2. **Match pips below** — option-(i) colour pips, one per match: **filled card-red = thuis,
   ring card-red = uit**, bright-green = jeugd-only-tint is NOT used (matches are all
   `Wedstrijden`/card-red; the jeugd colour belongs to event-type Jeugdwerking). **No count
   badge** — the pip row is the volume signal (owner: _"pips only, no badge"_).

Clicking a day opens the **selected-day detail** below the grid: full scoreboard rows reusing
the **6.C `<TeamAgendaRow>`** vocabulary (time · crests · KCVV-team label · thuis/uit ·
outcome colour) + event rows. (Unchanged interaction model from today's widget.)

## Agenda view — dense-day treatment (6d2)

**Labelled wall — show everything, no collapsing** (owner pick (i)):

- Month header (`<EditorialHeading>` "September '26.") → **day groups** with a
  `<DashedDivider>`; each day group carries a **count sub-header** ("Zaterdag 12 sep · 10
  wedstrijden · 1 evenement") that sets expectation.
- **Every row is shown** — no fold, no "+N more" by default (zero interaction).
- **Events get a tinted row** (jersey-deep wash) so they stand out from the match stack and
  are never buried — the one rescue the labelled-wall relies on.
- Match row = compact scoreboard (crest · `Team — Opponent` · VS/score · competition caption ·
  thuis/uit + outcome underline), reusing the 6.C row vocabulary at list density.

## Filters (confirmed from #1992 — finalised here)

- **By-type colour chips** (`<KalenderFilterBar>`), reusing `/evenementen`'s `EVENT_CHIP_BASE`
  - `EVENT_TYPE_FILL` vocabulary, on the light field. Locked set + order:
    **Alles · Wedstrijden · Clubevent · Supportersactiviteit · Jeugdwerking · Andere.**
- **Wedstrijden = `card-red` (`#c93f1c`)** — owner-locked (6d1/#1992), repurposing the Phase
  6.B alert token as the primary-category fill. The chip row **doubles as the colour legend**
  — so the standalone bottom legend ("Thuiswedstrijd / Uitwedstrijd / Evenement") that the
  legacy widget carried is **dropped** (the chips + cell vocabulary cover it).
- The filter applies across all three views (`?type=`), dedup-guarded `kalender_filter`
  (already shipped #1992). Filtered-to-zero state already shipped #1992.

## Outcome colour (reuse — 6.C lock)

**win = jersey-deep · draw = none · loss = brick (`--color-alert`)**, as a flat underline on
the score — applies to played matches in both the grid detail and the agenda. No new vocabulary.

## iCal subscribe (retain + reskin → 6d5 drilled 2026-06-05)

The **"Abonneer" panel is kept** — a **matches-only "follow your team" feed**, orthogonal to
the type filter (per PRD §2/§7). `/api/calendar.ics` is unchanged. No events in the subscribe
feed (per-event "Zet in agenda" already exists on `/evenementen/[slug]`).

The gate only asked for a "chrome reskin" — no layout was drilled — so a `6d5` A/B was run
(`6d5-subscribe-compare.html`, 3 options). **Owner picked (ii) "Seizoenskaart" — a perforated
ticket-stub:**

- **Left stub = the QR, always visible** (scan-to-add on mobile); a dashed perforation divides
  it from the body. The raw `webcal://` URL is **not surfaced** (it was technical noise).
- **Body** = `"Volg je ploeg(en)."` italic-display headline → selected-team tokens → a
  `Alle / Thuis / Uit` segmented control + a single **`Kopieer link`** button. The segmented
  control and the copy button are **equal height** (owner refinement).
- **Selected-team tokens use the new `<RemovableChip>` design-system primitive** (label + ×).
  Extracted here because the "chip with a cross" pattern was hand-rolled in ~6 places
  (organigram search bars, nav) and never consolidated — those are follow-up migrations.
- Subscribe **analytics** (`kalender_subscribe_*`) remain in **#1995**.

---

## Build implications (re-spec for #1994 / #1995)

**#1994 — Build the locked presentation:**

- Add an **Agenda view** rendering of the current-month feed window (labelled-wall list):
  new `<CalendarAgenda>` (Features/Calendar) composing month header + day groups (count
  sub-header + `<DashedDivider>`) + match/event rows (reuse 6.C row + `<TicketStub>`/MonoLabel
  type tags). VR-tagged + stories (empty / one-event-day / dense-Saturday / filtered).
- Extend the view toggle to 3-way (`Maand/Week/Agenda`), `?view=agenda`; share the month nav.
- **Reskin the grid** (`<CalendarMonth>`/`<CalendarWeek>` cells) to the 6d3 treatment
  (events-on-top titles + match pips, no badge) + paper/ink chrome; reskin the selected-day
  detail to the 6.C `<TeamAgendaRow>` scoreboard.
- Reskin `<CalendarSubscribePanel>` chrome. Drop the legacy bottom dot-legend.
- VR: the whole kalender surface (widget + agenda + chips) **adopts `vr`** at this phase —
  this is where the provisional #1992 `<KalenderFilterBar>` (currently non-VR) gets baselined,
  alongside the reskinned grid + new agenda. (Deferred from #1992 by design.)

**#1995 — iCal + analytics + SEO + cleanup:**

- `kalender_view_toggle` analytics on the Maand/Week/Agenda switch (taxonomy PRD §9, was
  "A/B-dependent" — now confirmed needed). `kalender_view` page-view. The manual GTM RegEx
  step (append `kalender_`) + the `kalender_type` GA4-dimension decision land here.
- Optional `ItemList` JSON-LD of the current window's items.

## Reuse mandate / no new vocabulary

Every surface maps back to an approved primitive: `EVENT_CHIP_BASE`/`EVENT_TYPE_FILL`
(filter), 6.C `<TeamAgendaRow>` + outcome colour (match rows), `<EditorialHeading>` (month
headers), `<DashedDivider>` (day groups), `<TicketStub>`/`<MonoLabel>` (type tags),
`<TapedCard>` shell (panels). **Net-new is only:** the 3-way toggle's Agenda option, the
grid-cell events-on-top+pips composition, and the agenda day-group count sub-header. No new
colour tokens (card-red already exists). No schema/BFF/api-contract change.
