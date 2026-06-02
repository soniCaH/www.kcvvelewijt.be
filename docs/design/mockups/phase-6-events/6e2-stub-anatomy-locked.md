# Phase 6.E · /evenementen — Round 2 (IA · ticket-stub anatomy) — LOCKED

**Date:** 2026-06-02
**Mockup:** `6e2-stub-anatomy-compare.html`

## Decision — Variant 2 "Type-gecodeerd" + whole-card interaction

### Interaction (applies to every ticket)

- The **whole ticket is a link** to `/evenementen/[slug]`.
- **Hover / focus-visible** → small **tilt + scale** and a **"Meer details →"** reveal, reusing the
  established `EditorialHero` featured-image idiom:
  `transition-transform duration-300 group-hover:scale-[1.02] group-hover:-rotate-1`
  (+ `group-focus-visible` equivalents, + `motion-reduce` resets). The reveal label is mono /
  uppercase / jersey-deep, `opacity-0 → group-hover:opacity-100`.

### Anatomy

- Tear-off **date block** colour **encodes `eventType`**:
  - Clubevent → `jersey-deep`
  - Supportersactiviteit → `warm`
  - Jeugdwerking → `jersey-bright`
  - Andere → `ink`
- **`eventType` pill is retained** as the accessible text label. Colour is a redundant fast-scan
  cue only — it is **not** the sole means of conveying type (WCAG 1.4.1). A **legend** explains the
  colour system on the list.
- Fields carried per ticket: **date** (day / MON / weekday + time, from `dateStart`) · **eventType
  pill** · **title** · **location**.

### Rejected

- **V1** (single brand colour) — chosen interaction adopted, but type-colour added on top.
- **V3** (+ Reserveer chip on the list) — second click target rejected; the external "Reserveer"
  CTA stays on the **detail page** (per master-design §6.7 "external link stays the CTA").
- **V4** (+ mini cover thumb) — list stays text-forward; no list imagery.

## Open refinements for the details round

- **Stub colour values must clear contrast on the `jersey-deep-dark` list field** — `jersey-deep`
  (Clubevent) and `ink` (Andere) risk blending into the dark background; tune values / add a hairline
  or cream inset so all four read distinctly. (Per-element detail — deferred per drill order.)
- Confirm whether the **legend** is always shown or only when >1 type is present.
- Weekday abbreviation format (ZA / ZO / …) and time display when an event is **time-less**.
