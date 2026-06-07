# Phase 7 · /club/ultras — Round 1 (REGISTER) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7u1-register-compare.html` (panel U2)
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master)

## Decision

**U2 · Terrace-poster hero + cream editorial body.**

The Ultras page leans hardest into the terrace identity — a loud, poster-weight **dark hero** — then
drops to a calm cream editorial body for the story.

## ⚠️ Flagged delta (scoped exception)

The hero uses **heavy-sans poster-weight display type** (e.g. Archivo Black, uppercase) — this is
**NET-NEW heading vocabulary**; the design system's heading language is italic-serif display
(`<EditorialHeading>`). **This is a deliberate, page-scoped exception** for the Ultras' distinct
supporters identity. It must **NOT** leak into the design system as a reusable pattern or precedent
(`feedback_guardrail_refinements_to_locked_primitives`). If a second surface ever wants it, that's a
separate system decision.

## Spine

```text
/club/ultras
├─ Hero (terrace-poster) — jersey-deep-dark band + diagonal stripe texture; mono kicker
│        "Supporters · KCVV Ultra's 55"; HEAVY-SANS uppercase poster headline (warm accent word);
│        lead; warm paper-stamp "Word lid via Facebook ↗" → facebook.com/KCVV.ULTRAS.55
├─ (cream editorial body)
│   ├─ Wie zijn we — MonoLabel kicker + EditorialHeading + prose + <TapedFigure> (ULTRAS_KAMPIOEN)
│   ├─ Wat doen we — prose + <PullQuote> (the blockquote) + a CALLOUT for "ALLE 500 lotjes / €750
│   │                cheque" (TapedCard / NumberDisplay) + <TapedFigure> (ULTRAS_SJR)
│   └─ Lid worden — short prose + Facebook CTA
└─ optional <CtaBand> — "Word lid via Facebook" (or keep the inline button)
```

## Derived details (from locked primitives)

- Body headings = `<EditorialHeading>` (italic serif) + `<MonoLabel>` kickers — the body stays
  **in-system** (only the HERO headline is the heavy-sans exception).
- Photos = `<TapedFigure>` newsprint (drop `rounded-lg`).
- Blockquote = `<PullQuote>`; "500 lotjes / €750" = a highlighted callout.
- Facebook CTA: hardened `rel="noopener noreferrer"`; warm paper-stamp button or `<CtaBand>`.
- Contrast: `text-white`/cream on the dark hero per the contrast rule.

## Build deltas (PRD seed)

- Reskin `UltrasPage` (`apps/web/src/app/(main)/club/ultras/page.tsx`): poster hero + cream
  editorial body; drop `<InteriorPageHero>` + green-left-border `h2`s + `rounded-lg`.
- **No data/schema/BFF change** (hardcoded content + 3 images + Facebook link).
- The heavy-sans hero type: use an existing weight if available, else a scoped utility — do NOT add
  a system heading token.
- Analytics: `ultras_view` page view (+ `ultras_join_click` on the Facebook CTA); add prefix to GTM
  regex (or fold under `club_`). Keep breadcrumb JSON-LD.
- Stories (`vr`) for the poster hero + a body section + the callout.

## Open for PRD time

- Exact hero headline (e.g. "KCVV ULTRA'S" vs a slogan like "ALTIJD LUIDER").
- Whether to source the heavy-sans from an installed family or a one-off.
