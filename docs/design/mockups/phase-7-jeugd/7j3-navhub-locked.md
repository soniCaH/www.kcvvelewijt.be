# Phase 7 · /jeugd — Round 3 (DETAIL: nav hub) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7j3-navhub-compare.html` (+ uniform-16:9 + bubbling refinements)
**Owner:** @climacon

## Decision

**Uniform 16:9 card grid with the current fixed-position "bubbling" logic preserved.**

The nav hub keeps today's model — it is **not** split into zones (N3 rejected) and **not** reflowed
into articles-first (N2-as-drawn rejected). Instead:

- **Card chrome (uniform):** every card is identical — a **16:9 image-top** region + text below
  (MonoLabel tag · italic-display title · optional description · mono arrow link). Replaces today's
  full-bleed-background + overlay model. TapedCard vocabulary, greyscale→hover-colour image,
  canonical press-down hover.
- **Fixed-position template:** the 9 slots sit at **predetermined positions**. Some slots are
  **article slots**, the rest are **fixed nav slots**.
  - **Article slots bubble:** the latest Jeugd-category articles auto-fill the article slots in
    order (newest first) — "bubbling up into fixed places."
  - **Nav links are pinned:** the 6 practical nav cards (word lid · jeugdvisie→`#visie` ·
    trainingen/PSD · organigram · hulp · medisch) stay on their fixed spots regardless.
- **Uniform sizing:** the Sanity `editorialCards.position` (`featured`/`medium`/`third`) no longer
  drives **size** (all cards are equal 16:9) — it now only controls **placement/order** within the
  fixed template. `cardType` (`nav` | `article`) still selects pinned-nav vs bubbling-article.

## Nav-card label refinement (data audit)

The tag pill is **editorially managed** — sourced from `editorialCards[].tag` (the editor sets it
on the `jeugdLandingPage` singleton) — with a **type-based fallback** when empty. The pill stays on
**both** variants. This is data-honest (it's real CMS data, not invented) and never blank.

- **Tag source (per card):** `editorialCards.tag` when set →
  fallback **`Jeugd`** for news/article cards, **`Praktisch`** for nav cards.
  (Article-card fallback may prefer the article's own `article.tags[0]` before "Jeugd" — richer;
  decide at build.)
- `editorialCards.tag` **stays in use** (no schema change). The earlier "drop the pill" /
  "single constant Praktisch" framings are both superseded by this editor-sourced + fallback rule.
- Visual: news pill = jersey-deep on the photo; nav pill = cream on the jersey-deep glyph panel.

## Implications

- **No schema change.** `jeugdLandingPage.editorialCards` (`tag`, `title`, `description`,
  `arrowText`, `href`, `image`, `position`, `cardType`) is reused as-is; only the render changes
  (uniform 16:9, position = placement not size).
- `<EditorialCard>` is reskinned (or replaced) to the 16:9 image-top TapedCard chrome; the
  `JeugdEditorialGrid` build logic (article bubbling into slots + nav fallback) is preserved.
- Nav-card targets repointed per 7j0b (jeugdvisie → `#visie`, etc.).

## Carry-forward (remaining DETAIL rounds)

- **Hero** — youth-photo `<TapedFigure>` treatment + fold in "gediplomeerde trainers".
- **Filosofie / visie** — block treatment + `#visie` anchor + copy distinct from hero lead.
- **Divisions** — confirm 6.C `<YouthDirectory>` reuse (likely no drill).
- **CTA** — band chrome + final target (the `/club/inschrijven` 404 fix).
- **Card chrome micro-detail** — tag style, title size, hover — tune alongside the hero treatment.
