# PRD: Redesign Phase 7 — Ultras (`/club/ultras`)

**Status**: Ready for implementation (design locked)
**Date**: 2026-06-07
**Design contract**: `docs/design/mockups/phase-7-ultras/7u1-register-locked.md` + `7u2-hero-image-locked.md`
**Epic**: #1529 (Redesign Phase 7) · **Milestone**: `redesign-retro-terrace-fanzine`

---

## 1. Problem statement

`/club/ultras` (the Ultras supporters page, custom `UltrasPage`) is pre-redesign: dark
`<InteriorPageHero>` + 3 hardcoded prose sections with green-left-border `h2`s + `rounded-lg` images

- a Facebook CTA. Content is **entirely hardcoded** (no CMS) → pure visual reskin.

The Ultras **are** the terrace/fanzine subject, so this page leans hardest into the vocabulary: a
loud **terrace-poster hero** (full-bleed crowd photo + jersey-deep wash + heavy-sans headline) over a
calm cream editorial body.

## 2. Scope

### In scope (`apps/web` only)

- Reskin `apps/web/src/app/(main)/club/ultras/page.tsx`.
- **Terrace-poster hero** (V2): full-bleed `public/images/ultras.jpg` + jersey-deep duotone wash +
  `--pattern-jersey-stripes` + centred heavy-sans headline + warm Facebook CTA.
- Cream editorial body: `<EditorialHeading>` + `<MonoLabel>` section kickers; `<TapedFigure>` photos
  (ULTRAS_KAMPIOEN / ULTRAS_SJR); `<PullQuote>` for the blockquote; a callout for "500 lotjes / €750".
- Commit the new hero asset `apps/web/public/images/ultras.jpg`.

### Out of scope

- **No content changes** (copy stays hardcoded). **No schema / BFF / data change.**

## 3. Scoped exception (carried from 7u1)

The hero headline uses **heavy-sans poster type** — net-new heading vocabulary, the system uses
italic-serif `<EditorialHeading>`. **Deliberate, page-scoped exception** for the Ultras identity;
**must not** become a system token/pattern. Use an existing weight (Archivo Black) scoped to this
hero; do NOT add a heading token.

## 4. Acceptance criteria

- [ ] Hero: full-bleed `<Image fill>` `ultras.jpg` (`object-cover`, `object-position center 35%`,
      alt "KCVV Ultras aan de omheining") + jersey-deep wash + `--pattern-jersey-stripes` overlay;
      centred mono kicker `SUPPORTERS · KCVV ULTRA'S 55` + heavy-sans uppercase headline (warm accent
      word) + warm paper-stamp "Word lid via Facebook ↗" (`rel="noopener noreferrer"`, target blank).
- [ ] Text uses `text-white`/cream (contrast on the dark wash). Heavy-sans is scoped to this hero only.
- [ ] Body: 3 sections (Wie zijn we / Wat doen we / Lid worden) on cream with `<MonoLabel>` +
      `<EditorialHeading>`; `<TapedFigure>` newsprint photos (drop `rounded-lg`); `<PullQuote>` for
      the blockquote; a highlighted callout for "ALLE 500 lotjes / €750".
- [ ] Drop `<InteriorPageHero>` + green-left-border `h2`s; legacy tokens removed.
- [ ] `apps/web/public/images/ultras.jpg` committed.
- [ ] Analytics: `ultras_view` page view + `ultras_join_click` on the Facebook CTA; add prefix to GTM
      regex (or fold under `club_`), note in PR. No PII.
- [ ] Stories (`vr`) for the poster hero + a body section + the callout; e2e `/club/ultras` smoke green.
- [ ] `pnpm --filter @kcvv/web check-all` + VR green.

## 5. Open questions

1. Headline wording: "De luidste hoek." vs "Altijd luider." vs "KCVV Ultra's".
2. Keep the hero image as a local public asset vs Sanity-host it (local for now).
3. Analytics prefix: dedicated `ultras_` vs shared `club_`.
