# Phase 8 — Data-reality lock (search · privacy · errors)

Anchors every Phase 8 mockup to fields the app actually has, so no mockup renders
data we can't ship. Read before any `8s*` / `8p*` / `8e*` round.

Re-scope note (2026-06-08): `/hulp` left Phase 8 → delivered in Phase 7 (#1529).
Phase 8 = three edge surfaces only: `/zoeken`, `/privacy`, 404/500.

---

## 1. `/zoeken` — search results

Source of truth: `apps/web/src/types/search.ts`, `SearchInterface.tsx`,
`SearchResult.tsx`, `/api/search/route.ts`.

`SearchResult`:

| Field         | Type                                          | Notes                                  |
| ------------- | --------------------------------------------- | -------------------------------------- |
| `id`          | string                                        | Sanity/internal id — hash if analytics |
| `type`        | `"article" \| "player" \| "staff" \| "team"`  | drives icon + label                    |
| `title`       | string                                        | always present                         |
| `description` | string?                                       | snippet — articles/teams mostly        |
| `url`         | string                                        | result link                            |
| `imageUrl`    | string?                                       | ~most articles + players; teams often none |
| `tags`        | string[]?                                     | **articles only**                      |
| `date`        | string?                                       | **articles only**                      |

`SearchResponse`: `{ query, count, results }`. Counts per type computed
client-side for the filter row (`all / article / player / staff / team`).

States that must be designed (all real, all in current code):

1. **Pre-search** (`query < 2 chars`) — help/suggestions block.
2. **Loading** — spinner during fetch.
3. **Error** — fetch failed message.
4. **No-results** — valid query, 0 hits (after type-filter too).
5. **Results** — mixed-type grid + type-filter row with counts.

Type labels (locked, from `SearchResult.tsx`): Nieuws · Speler · Staf · Team.
Search backend is bge-m3 semantic search (Vectorize) — already shipped #2057,
**not** in Phase 8 scope. Phase 8 reskins the *presentation* only.

Must-avoid: a full taped-card grid of results reads "seasick" (master-design
rotation-pool lesson, #1672). Result vocabulary round (8s2) weighs this.

---

## 2. `/privacy` — long-form legal prose

Source: `apps/web/src/app/(main)/privacy/page.tsx`. Static copy, no CMS.

- `LAST_UPDATED` constant (currently `"februari 2026"`).
- ~11 H2 sections: Contactgegevens · Welke gegevens · Waarvoor · Rechtsgrond ·
  Delen we je gegevens · Bewaartermijn · Jouw rechten · Cookiebeleid ·
  Beveiliging · Wijzigingen · Vragen over privacy.
- Club address: Driesstraat 30, 1982 Elewijt. Emails info@ / kevin@.
- Master-design directive: **clean prose, no chrome flourishes.** This is the
  one Phase 8 surface explicitly told to stay restrained.
- Cross-links to `/hulp` (now the unified hub) — keep.

Must-avoid: magazine chrome / fabricated edition data (memory: no-magazine-chrome).

---

## 3. 404 / 500 — error pages

Source: `apps/web/src/app/not-found.tsx` (404), `apps/web/src/app/error.tsx` (500, `"use client"`).

- **404** — copy "Pagina niet gevonden"; one CTA → home.
- **500** — copy "Er ging iets mis"; two CTAs → `reset()` + home. `error.tsx`
  receives `{ error, reset }`; `reset` must stay wired to a real button.
- Master-design directive: **football-themed pun + cream-bg + `<JerseyShirt>`
  taped artefact.** `<JerseyShirt>` is a shipped Phase 4.5 primitive.
- These render OUTSIDE `(main)` route group → no guaranteed SiteHeader/Footer
  context on `error.tsx` (root segment). Keep self-contained.

Must-avoid: fabricated stamnummer/score chrome; real club voice only.

---

## Shared vocabulary available (no new primitives this phase)

`<EditorialHeading>`, `<MonoLabel>` / `<MonoLabelRow>`, `<TapedCard>`,
`<TapedFigure>`, `<TapeStrip>`, `<JerseyShirt>`, `<NumberDisplay>`,
`<FilterTabs>`, `<DottedDivider>` / `<DashedDivider>` / `<SolidDivider>`,
`<StripedSeam>`, `<LinkButton>` / `<Button>` (Phase 2 retro tokens),
Phosphor Fill icons via `@/lib/icons.redesign`. Master-design §7 line 587:
migrate `<SectionTransition type="diagonal">` consumers (hulp + privacy) to
`<StripedSeam>` in this phase.
