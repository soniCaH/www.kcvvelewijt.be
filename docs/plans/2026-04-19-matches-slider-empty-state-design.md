# Matches slider — empty-state placeholder + padding fix

**Issue:** [#1323](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1323)
**Date:** 2026-04-19
**Status:** Approved — ready for implementation plan

## Problem

The homepage `matches-slider` section has two defects:

1. **Padding asymmetry** — top and bottom padding of the dark section are not visually equal.
2. **Empty state** — when no upcoming matches exist (off-season, ~2-3 months/year), `MatchesSliderSection` returns `null` and `SectionStack` drops the entire `kcvv-black` block. This breaks the Youth section's hardcoded `prevBg="kcvv-black"` diagonal transition assumption (`apps/web/src/app/page.tsx:271`) and leaves the homepage visually incoherent.

## Decision summary

- Build a **designed placeholder** (not a fallback message) that renders whenever the section would otherwise be empty.
- Placeholder is **layered**: an always-on baseline (no editorial work required) plus optional Sanity-driven enrichment.
- Ship **two layout candidates in Storybook** (split 2:1, centered card) — pick by visual review, delete the loser before merge. Default bet: split layout wins.
- Fix the padding asymmetry scoped to this section only.
- In-scope cleanup: extract social URLs to `EXTERNAL_LINKS`; remove Twitter everywhere.

## Scope

### In scope

- New `MatchesSliderEmptyState` component with two layout variants, full variant matrix in Storybook.
- New Sanity object schema `matchesSliderPlaceholder` embedded on the home-page document.
- Wire-up in `apps/web/src/app/page.tsx`.
- Padding asymmetry fix (scoped `paddingBottom` override on the matches-slider `SectionConfig`).
- `EXTERNAL_LINKS` extension: `psdDashboard`, `facebook`, `instagram` (replacing inline hardcoded URLs in `SocialLinks.tsx`).
- Twitter removal across `apps/web` and related tests.
- Committed default photo asset in `apps/web/public/images/home/`.

### Out of scope

- Broad `SectionHeader.mb-10` refactor (only override locally if needed).
- Sanity Studio UX rework (tracked separately).
- Homepage schema restructure beyond adding the one new field.

## Design

### Container

- Lives inside the existing `MatchesSliderSection` wrapper: `max-w-7xl mx-auto px-4 md:px-8`.
- Section background: `kcvv-black` (unchanged).
- `SectionHeader` ("Wedstrijden" + "Alle wedstrijden →") stays unchanged on top.
- New component: `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.tsx`.
- `MatchesSliderSection` renders `<MatchesSlider>` when `matches.length > 0`, else `<MatchesSliderEmptyState placeholder={placeholder} />`.

### Layout B — Split 2:1 (primary candidate)

- Grid: `grid-cols-1 md:grid-cols-3`, photo `md:col-span-2`, content `md:col-span-1`.
- Gap: `gap-6 md:gap-8`.
- Photo: `next/image` `fill` inside `relative rounded-xl overflow-hidden aspect-video`.
- Content panel: `flex flex-col justify-center gap-4`, vertically centered relative to photo.

### Layout C — Centered card (alternative candidate)

- Single column, `max-w-2xl mx-auto`, `text-center`, `py-8`.
- Photo: `max-w-sm`, `aspect-square` or `aspect-video`, centered.
- Content tightly grouped below photo.

### Decision rule (priority order)

1. If `nextSeasonKickoff` is set and in the future → primary line = countdown.
2. Else if `announcementText` is set → primary line = announcement (motto demoted).
3. Else → primary line = motto.

When `nextSeasonKickoff` and `announcementText` are both set: countdown primary, announcement secondary.

### Copy (Dutch)

| State                    | Eyebrow         | Primary line                                 | Secondary line                                        |
| ------------------------ | --------------- | -------------------------------------------- | ----------------------------------------------------- |
| Baseline                 | `TUSSENSEIZOEN` | _"Er is maar één plezante compagnie"_        | _"We zijn terug in juli!"_                            |
| Countdown                | `NIEUW SEIZOEN` | _"Nog **{n} dagen** tot het nieuwe seizoen"_ | _"Aftrap op {date, e.g. 'zondag 10 augustus'}"_       |
| Announcement             | `MEDEDELING`    | `announcementText` (editorial)               | _"Er is maar één plezante compagnie"_ (motto demoted) |
| Countdown + announcement | `NIEUW SEIZOEN` | Countdown                                    | `announcementText` + optional inline link             |

Edge cases:

- `nextSeasonKickoff` in the past → treat as unset, fall back to motto.
- `n === 0` → _"Het seizoen start vandaag!"_.
- `n === 1` → _"Nog **1 dag** tot het nieuwe seizoen"_ (singular).

Countdown is computed server-side at request time (section is ISR-cached at 1h via `revalidate = 3600`). No client ticker, no hydration mismatch risk.

### CTAs

Two buttons, always rendered.

1. **PSD dashboard** — primary button.
   - `href={EXTERNAL_LINKS.psdDashboard}` (`https://kcvv.prosoccerdata.com/dashboard`)
   - Label: _"Bekijk op PSD"_
   - Trailing Lucide `ExternalLink` icon.
2. **Facebook** — ghost/secondary button.
   - `href={EXTERNAL_LINKS.facebook}`
   - Label: _"Volg ons op Facebook"_
   - Leading Lucide `Facebook` icon.

Plus optional inline text link for `announcementHref` when set (tertiary, not a button).

Both open in a new tab (`target="_blank" rel="noopener noreferrer"`). Instagram is defined in `EXTERNAL_LINKS` (consumed by footer `SocialLinks`) but not surfaced here — Facebook chosen as the single social CTA.

### Typography + tokens

- Eyebrow: `text-xs md:text-sm font-semibold tracking-[0.15em] uppercase text-kcvv-green-bright`.
- Primary line: `text-2xl md:text-4xl lg:text-5xl font-bold leading-tight text-white`. Countdown `{n}` wrapped in `<strong className="text-kcvv-green-bright">`.
- Secondary line: `text-base md:text-lg text-white/70 leading-relaxed`.
- CTAs: existing design-system `Button` primary + ghost variants, `gap-3`. No inline color overrides.
- Photo wrapper: `rounded-xl overflow-hidden`.
- Design tokens only — no arbitrary hex, no emoji.

### Responsive behavior

| Breakpoint     | Layout B                                              | Layout C                                 |
| -------------- | ----------------------------------------------------- | ---------------------------------------- |
| `<md`          | Stacked: photo → content, `text-left`.                | Stacked: photo → content, `text-center`. |
| `md` (≥768px)  | 3-col grid, photo `col-span-2`, content `col-span-1`. | Centered `max-w-2xl`.                    |
| `lg` (≥1024px) | Same as `md`, typography scales up.                   | Same as `md`.                            |

CTAs on mobile: `flex-col sm:flex-row gap-3`. Min 44px tap target via `Button` component.

`next/image` `sizes`:

- Layout B: `(max-width: 768px) 100vw, 66vw`
- Layout C: `(max-width: 768px) 100vw, 640px`

### Accessibility

- Section retains `<section>` landmark.
- Default photo: `alt=""` (decorative). Sanity `highlightImage`: meaningful `alt` required (schema validation).
- Countdown: `aria-label` on the primary line includes the full date.
- External CTAs: `aria-label` suffix _"(opent in nieuw tabblad)"_.
- Color contrast: verify white-on-`kcvv-black` ≥ 4.5:1 and green-bright-on-`kcvv-black` for primary CTA.

### Sanity schema

New object schema at `packages/sanity-schemas/src/matchesSliderPlaceholder.ts`:

```typescript
import { defineField, defineType } from "sanity";

export const matchesSliderPlaceholder = defineType({
  name: "matchesSliderPlaceholder",
  title: "Placeholder wedstrijdenblok (tussenseizoen)",
  type: "object",
  description:
    "Optionele inhoud voor het wedstrijdenblok wanneer er geen aankomende wedstrijden zijn. Laat leeg voor de standaardweergave.",
  fields: [
    defineField({
      name: "nextSeasonKickoff",
      title: "Aftrap nieuw seizoen",
      type: "date",
      description:
        "Datum van de eerste wedstrijd. Wordt getoond als aftelling. Laat leeg als nog niet bekend.",
      options: { dateFormat: "DD-MM-YYYY" },
    }),
    defineField({
      name: "announcementText",
      title: "Mededeling",
      type: "string",
      description:
        "Korte tekst (max 80 tekens), bv. 'Kalender 25-26 volgende week online'.",
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: "announcementHref",
      title: "Mededeling — link",
      type: "url",
      description: "Optionele link bij de mededeling.",
      validation: (rule) =>
        rule.uri({ scheme: ["http", "https"], allowRelative: true }),
    }),
    defineField({
      name: "highlightImage",
      title: "Afbeelding (overschrijft standaard)",
      type: "image",
      description:
        "Optionele afbeelding die de standaardfoto vervangt. Liefst horizontaal, min. 1280x720.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt-tekst",
          type: "string",
          validation: (rule) =>
            rule
              .required()
              .error("Alt-tekst is verplicht voor toegankelijkheid."),
        }),
      ],
    }),
  ],
});
```

Embedded on the home-page document:

```typescript
defineField({
  name: "matchesSliderPlaceholder",
  title: "Placeholder wedstrijdenblok",
  type: "matchesSliderPlaceholder",
}),
```

No migration needed — every field optional; existing documents gain `undefined`.

### GROQ extension

```groq
matchesSliderPlaceholder {
  nextSeasonKickoff,
  announcementText,
  announcementHref,
  "highlightImage": highlightImage{
    alt,
    "asset": asset->{
      _id,
      url,
      "lqip": metadata.lqip,
      "dimensions": metadata.dimensions
    }
  }
}
```

### Padding asymmetry fix

Scoped override on the matches-slider `SectionConfig` in `apps/web/src/app/page.tsx`:

```typescript
const matchesSliderSection: SectionConfig = {
  key: "matches-slider",
  bg: "kcvv-black",
  content: <MatchesSliderSection matches={sliderMatches} ... />,
  paddingBottom: "pb-16", // confirm exact value in browser
};
```

No changes to `SectionHeader` or `SectionStack` defaults — blast radius limited to this one section.

### Twitter removal + EXTERNAL_LINKS extraction

Extend `apps/web/src/lib/constants.ts`:

```typescript
export const EXTERNAL_LINKS = {
  webshop: "https://www.brandsfit.com/kcvvelewijt/nl-eu",
  psdDashboard: "https://kcvv.prosoccerdata.com/dashboard",
  facebook: "https://facebook.com/KCVVElewijt/",
  instagram: "https://www.instagram.com/kcvve",
} as const;
```

Remove `SITE_CONFIG.twitterHandle`. Refactor `SocialLinks.tsx` to read from `EXTERNAL_LINKS` and drop the Twitter entry. Grep `apps/web` for `twitter`, `Twitter`, `twitterHandle`, `kcvve` (Twitter handle); remove from JSON-LD, page metadata, icon barrel, and tests.

## Variant matrix — Storybook

Story title: `Features/Home/MatchesSliderEmptyState`. Six variants per layout (12 stories total):

| #   | Name                     | `nextSeasonKickoff` | `announcementText` | `highlightImage` |
| --- | ------------------------ | ------------------- | ------------------ | ---------------- |
| 1   | Baseline                 | —                   | —                  | —                |
| 2   | With countdown           | ✅                  | —                  | —                |
| 3   | With announcement        | —                   | ✅                 | —                |
| 4   | Countdown + announcement | ✅                  | ✅                 | —                |
| 5   | Custom image             | —                   | —                  | ✅               |
| 6   | All populated            | ✅                  | ✅                 | ✅               |

Plus a mobile-viewport snapshot of the baseline for each layout.

## File manifest

### New

- `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.tsx`
- `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.stories.tsx`
- `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.test.tsx`
- `apps/web/public/images/home/matches-empty-state.jpg` (committed brand photo)
- `packages/sanity-schemas/src/matchesSliderPlaceholder.ts`

### Modified

- `apps/web/src/app/page.tsx` — fetch placeholder, pass to section, scoped `paddingBottom: "pb-16"`.
- `apps/web/src/components/home/MatchesSliderSection/MatchesSliderSection.tsx` — render empty state instead of returning `null`.
- `apps/web/src/components/match/MatchesSlider/MatchesSlider.tsx` — keep defensive `null` guard.
- `apps/web/src/lib/constants.ts` — extend `EXTERNAL_LINKS`, remove `twitterHandle`.
- `apps/web/src/components/design-system/SocialLinks/SocialLinks.tsx` — read URLs from `EXTERNAL_LINKS`, remove Twitter.
- `apps/web/src/components/design-system/SocialLinks/SocialLinks.test.tsx` — remove Twitter assertions.
- `packages/sanity-schemas/src/index.ts` — export new schema.
- Home-page schema file (exact location TBD during implementation) — embed field.
- `apps/web/src/lib/seo/jsonld.ts` — remove Twitter/sameAs reference if present.
- Any metadata or test files referencing `twitterHandle`.

## Acceptance criteria

- Top and bottom of the matches-slider section render visually equal relative to the diagonal transitions.
- Homepage with zero upcoming matches still renders a coherent layout with the designed placeholder; Youth section's diagonal transition still looks correct.
- Both layout candidates (B and C) exist in Storybook with the full variant matrix; final choice made during review, losing layout deleted before merge.
- `EXTERNAL_LINKS` owns all external URLs used by the placeholder + footer social icons; no inline hardcoded social URLs remain in components.
- Twitter fully removed: no references in `apps/web` source, tests, metadata, JSON-LD, or `SITE_CONFIG`.
- New Sanity field is optional and renders nothing when unset (baseline state is fully usable without editorial input).
- No hardcoded colors; design tokens only.
- No emoji anywhere in source (use Lucide icons).
- Unit tests cover the countdown decision rule, edge cases (past date, `n=0`, `n=1`), and the announcement fallback chain.
- Storybook builds; `pnpm --filter @kcvv/web check-all` passes.

## Open questions — resolved during design

- Default photo source → committed asset in `apps/web/public/images/home/`.
- Instagram vs Facebook CTA → Facebook.
- Date-driven vs always-on → layered (always-on baseline + optional Sanity overlay).
- Placeholder vs section removal → placeholder, to preserve Youth section's diagonal transition.
- PSD URL → `https://kcvv.prosoccerdata.com/dashboard` as platform constant.
