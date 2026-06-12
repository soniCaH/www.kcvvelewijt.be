# 8e1 — 404/500 composition · DEFERRED to a Storybook A/B

**Decision:** Do **not** pick the layout from the static mockup. Owner wants to see
the scoreboard (C) rendered live before choosing. Build **both** A and C as
Storybook stories, owner picks in Storybook, then **delete the unpicked variant**
before wiring into the routes (memory: storybook-checkpoint-on-delivery).

This is an explicit acceptance-criterion for the error-page implementation issue:

1. Build one shared `<ErrorState>` component (`apps/web/src/components/error/` or
   `design-system/`) that renders both `not-found.tsx` (404) and `error.tsx` (500),
   parameterised by `code`, `pun`, `body`, and `actions` (500 adds a "Probeer
   opnieuw" button wired to `reset()`).
2. Ship it with a `layout: "centered" | "scoreboard"` prop and a Storybook story
   per layout × per page (404-centered, 404-scoreboard, 500-centered,
   500-scoreboard).
3. **Pause for owner Storybook review.** Owner picks one layout.
4. Remove the losing layout branch + its stories; wire the winner into both routes.

## Candidate A — Centered, code-as-jersey-number

Taped `<JerseyShirt>` with the HTTP **code as the shirt number** (404/500), mono
code line, serif italic pun headline, body line, centered button(s). Clean;
identical for both pages. Lowest risk.

## Candidate C — Scoreboard

Giant Freight Display code as the hero; the **middle `0` becomes the jersey**
(scoreboard energy). Boldest. Only reads for codes with a middle `0` (404 + 500
both qualify); biggest furniture. The variant the owner most wants to see live.

## Shared (both layouts, LOCKED)

- Cream bg + paper-grain; the canonical retro tokens.
- `<JerseyShirt>` is the shipped Phase 4.5 primitive — reuse, don't redraw.
- Buttons are **plain/clear, not punny** ("Naar de homepage" + "Probeer opnieuw")
  so the action stays obvious — the wink lives in the headline only.
- 500's "Probeer opnieuw" MUST stay wired to the `reset()` callback from
  `error.tsx`. `error.tsx` is `"use client"` and renders at the root segment
  (no guaranteed SiteHeader/Footer) — keep `<ErrorState>` self-contained.
- Pun copy → locked in 8e2 (layout-independent; the Storybook prototype uses it).
