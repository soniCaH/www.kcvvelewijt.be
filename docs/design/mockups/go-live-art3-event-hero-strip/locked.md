# ART-3 — Event-fact hero strip — LOCKED

**Issue:** #2237 (ART-3) · go-live-ux-polish
**Locked:** 2026-06-23 by @climacon
**Mockup:** `compare.html` (variants A–D)
**Chosen:** **Variant B — Taped index-card**

---

## Visual lock

The hoisted first-eventFact "hero strip" (`EventDetailBlock`, between the article hero and body on `articleType=event`) becomes a **contained** taped index-card — no more full-bleed bar.

- `<TapedCard>` (border-2 ink + offset shadow) with **one** washi `<TapeStrip>`.
- **3-column fact grid** — Locatie / Datum / Tijd — each column a `<MonoLabel>` kicker over the value.
- CTAs below the grid: **Reserveer** (jersey-deep) + **Zet in agenda**.
- Contained to the **wide container** (`--container-wide`, ~1040px). Never full-bleed.
- Sharp corners; jersey-deep (#008755), cream/ink palette.

Rejected: A (ticket-stub) / C (jersey boarding-pass band — too heavy) / D (seam-framed — too quiet).

## Past-event treatment

Mirror the inline polaroid lock: tag pill → muted **Afgelopen** pill, facts greyscaled, **CTA row hidden**. Reuse the page-level `deriveIsPast` helper.

## Scope / contract

- Component: `apps/web/src/components/article/blocks/EventDetailBlock/EventDetailBlock.tsx`.
- Reuses existing primitives only (TapedCard, TapeStrip, MonoLabel, jersey-deep CTA) — no new vocabulary, no schema change.
- Leaves the **inline** `EventFactInline` polaroid untouched (separately locked in `phase-5-article-detail/eventfact-inline-locked.md`).
- Storybook: upcoming · past (Afgelopen) · minimal (required fields only) · CTA-less · mobile.

## Source-of-truth

- Mockup: `docs/design/mockups/go-live-art3-event-hero-strip/compare.html`
- Memories: `feedback_reuse_approved_primitives`, `feedback_sharp_corners_no_radius`, `feedback_no_bright_jersey`.
