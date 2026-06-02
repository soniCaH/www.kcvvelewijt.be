# Phase 6.E · Events (`/evenementen`) — Consolidated Design Lock

**Date:** 2026-06-02
**Branch:** `design/phase-6e-events`
**Drill rounds:** `6e1`–`6e5` (each with its own `*-locked.md`)
**Supersedes for 6.E:** master-design `§6.7` decisions (route, EventHero, schema deltas) — this doc
is the visual contract for the implementation PRD.

---

## 1. Surfaces

- **`/evenementen`** — upcoming-only events list (renamed from `/events`; **301** from `/events/*`).
- **`/evenementen/[slug]`** — event detail page.

Both are part of the retro-terrace-fanzine redesign and reuse the locked design-system primitives.

## 2. List page (`/evenementen`)

**Voice:** ticket-stub poster wall on a **dark `jersey-deep-dark` field**.

**Header:** `EditorialHeading` "Evenementen." (display serif, cream) + mono kicker
("KCVV ELEWIJT · AGENDA").

**Filters:** a row of **colour-coded chips** that double as the legend (no separate legend):

| Chip                       | Colour          |
| -------------------------- | --------------- |
| Alles (default, no filter) | cream           |
| Clubevent                  | `jersey-deep`   |
| Supportersactiviteit       | `warm`          |
| Jeugdwerking               | `jersey-bright` |
| Andere                     | `ink`           |

Selected = filled with the type colour; unselected = dimmed cream outline. Single-select in v1.
Each chip keeps its text label (type is never colour-only — WCAG 1.4.1).

**Layout:** **single column, grouped by month.** Each month = display-serif month name +
`StripedSeam` rule, then that month's tickets chronologically. Year shown on the header only when
the list crosses into the next calendar year. A month whose tickets are all filtered out **hides
its header**.

**Ticket (`<TicketStub>` — NEW component):**

- Left **tear-off date block** (dashed divider, no punch-holes), **colour = `eventType`** (table
  above). Shows weekday (ZA) / big serif **day** / **month** (SEP). The 2px ink ticket border
  frames every stub colour, so all four read against the dark field.
- Body: `eventType` **pill** · display-serif **title** · mono **meta** (`time · location`).
- **Whole ticket is a link** to `/evenementen/[slug]`.
- **Hover / focus-visible:** tilt + scale + a **"Meer details →"** reveal — the `EditorialHero`
  featured-image idiom: `transition-transform duration-300 group-hover:scale-[1.02]
group-hover:-rotate-1` (+ `group-focus-visible`, + `motion-reduce` resets); reveal is mono /
  uppercase / jersey-deep, `opacity-0 → group-hover:opacity-100`.
- **No** list CTA, **no** cover thumbnail (text-forward).

## 3. Detail page (`/evenementen/[slug]`)

**Voice:** **editorial, cream page** — a calm contrast to the dark list (dark index → light detail).

**`<EventHero>` (NEW component), centred:**

1. `eventType` pill (jersey-deep).
2. Mono date/location kicker — full date (`ZATERDAG 14 SEPTEMBER · 18:00`).
3. Display-serif title with italic jersey-deep emphasis on the accent word.
4. Mono location line.
5. **CTAs** (centred):
   - **Reserveer ↗** — warm filled; **only when `externalLink` is set** (label =
     `externalLink.label`, fallback "Reserveer"); opens external in a new tab.
   - **＋ Zet in agenda** — outline; **always present**; downloads an **iCal** (`.ics`) for the event.
6. **Cover** — `TapedFigure` (tilted + taped) below the CTAs, **only when `coverImage` exists**.

**Below hero:** **"Andere events"** — `StripedSeam` heading + the locked `<TicketStub>` in a grid
(upcoming events, excluding the current one). **No** body Portable Text, **no** RSVP, **no** sponsor
footer (per §6.7).

## 4. States

- **Empty list** (no upcoming events): centred message on the dark field — e.g. _"Geen evenementen
  gepland — kom snel terug."_ (mono kicker + serif line). No month headers, no filter row.
- **Filtered-to-zero** (a type has no upcoming events): _"Geen [type] gepland."_ + a **"Toon alles"**
  reset chip. Filter row stays visible.
- **Multi-day** (`dateStart` + `dateEnd`): stub shows the **start** day; the meta/kicker shows the
  **range** (list meta: `14–15 SEP`; hero kicker: `ZA 14 – ZO 15 SEPTEMBER`).
- **Time-less / all-day** (`dateStart` time is `00:00`, or `eventFact.startTime` absent): **omit the
  time**, show the date only.
- **No cover** (`coverImage` absent — the common case): detail hero omits the `TapedFigure` (just the
  centred text + CTAs). List is unaffected (no thumbs).
- **No externalLink:** the **Reserveer** CTA is hidden; only **＋ Zet in agenda** shows.

## 5. Schema deltas (`packages/sanity-schemas`)

- **`event`** (root doc): add **`location`** (string) + **`eventType`** enum
  (`Clubevent` | `Supportersactiviteit` | `Jeugdwerking` | `Andere`).
- **`eventFact`** (block): add the same **`eventType`** enum, so `articleType:event` articles join the
  merged feed.
- **OPEN for PRD:** root `event` has **no `address`** (only `eventFact` does). Decide: add `address`
  to the `event` delta, or show **`location` only** on the detail page for root events. (Do not
  fabricate an address.)
- The `/evenementen` list is **events-only** (`event` docs + `articleType:event` articles), upcoming
  only. The 3-source feed _including PSD matches_ is the separate **`/kalender`** surface (§6.6), out
  of scope here.

## 6. Component deltas (`apps/web`)

- **NEW `<TicketStub>`** — the type-coloured tear-off ticket; consumed by the list and the detail
  "Andere events" grid. Both `default` (list, full-width) and a denser grid use.
- **NEW `<EventHero>`** — editorial detail hero (NOT a variant of `<EditorialHero>`).
- **Reskin** `<EventCard>` / `<EventsList>` → replace with `<TicketStub>` + the month-grouped list, or
  retire them.
- **Route:** add `/evenementen` + `/evenementen/[slug]`; 301 redirect `/events/*` → `/evenementen/*`.
- **iCal:** a `.ics` generator for "Zet in agenda" (title, start/end, location, description).

## 7. Primitives reused (no net-new beyond §6)

`EditorialHeading`, `MonoLabel`/pill, `StripedSeam`, `TapedFigure` (tilted+taped cover), the
`EditorialHero` hover idiom. Tokens: `cream`, `jersey-deep`, `jersey-deep-dark`, `jersey-bright`,
`warm`, `ink`.

## 8. Analytics (per repo policy — confirm in PRD)

- `event_view` (detail) — `event_slug`, `event_type`.
- `event_cta_click` — `event_slug`, `cta` (`reserveer` | `agenda`).
- List filter usage — `event_filter` with `event_type`.

## 9. Open questions for the PRD

1. `address` on `event` delta vs `location`-only on detail (see §5).
2. Single- vs multi-select filters (locked single for v1 — confirm).
3. iCal: client-side `.ics` blob vs a BFF endpoint.
4. Empty/filtered-zero copy wording (Dutch) — final strings.
