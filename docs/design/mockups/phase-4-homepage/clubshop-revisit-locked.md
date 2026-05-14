# Phase 4.5 · Clubshop section — Locked (R6)

**Locked 2026-05-14.**
**Supersedes:** open follow-ups in `webshopbanner-locked.md` (Round 9 + 9b + 9c).
**Source compare page:** `round-r6-clubshop-revisit-comparisons.html`.
**Owner:** @climacon.

## Decision

**R6.C · Mirrored stripe frame + small `<JerseyShirt>` illustration.**

The clubshop section gets full retro-fanzine framing: stripe bands at
TOP and BOTTOM (the only section on the homepage with both edges
framed), full-bleed dark green surface, and a small `<JerseyShirt>`
illustration in the top-right corner. New copy per brief §10:
"Onze clubkledij." heading + Brandsfit-led subheading + single CTA.

Owner accepted the small divergence from brief §10's strict "no product
images" reading. The `<JerseyShirt>` is an illustration in the
two-pass print vocabulary (`project_jersey_illustration_vocabulary`),
not a photograph — and it's small (~140px), corner-anchored rather
than central — so it reads as a paper graphic, not a product shot.

## Composition

```text
[Mirrored stripe seam — top]
   <StripedSeam>           jersey-dark + jersey-deep alternating
                           ~28px tall · 45° stripes · ink borders top + bottom

[Clubshop section — jersey-deep-dark full-bleed]
                                                  ┌──────────┐
   Onze *clubkledij*.                             │ <Jersey  │
   (italic + warm-accent on "clubkledij")         │  Shirt>  │
                                                  │ ~140px   │
   Beschikbaar via Brandsfit,                     │ corner   │
     onze kledingpartner.                         └──────────┘

   [Naar de Brandsfit clubshop ↗]
   (cream-on-jersey button · external link · ↗ glyph)

[Mirrored stripe seam — bottom · 45° flipped to -45°]
   <StripedSeam>           same colours · mirrored angle

[Footer]
```

## What's locked

### Constants

- **Position:** after SponsorsBlock, before footer (per R4.B).
- **Surface:** `bg-jersey-deep-dark` (existing `--color-jersey-deep-dark`
  token). NOT photo + green overlay (that pattern is reserved for
  Youth).
- **Stripe bands:** `<StripedSeam>` at TOP and BOTTOM. This is the
  ONLY homepage section with stripe bands on both edges — the
  mirrored frame visually "tapes" the clubshop as a discrete package.
  - Colours: `jersey-dark` + `jersey-deep` alternating (stronger
    contrast than Youth's `jersey-deep` + `jersey-light`).
  - Bottom seam mirrors top by flipping the diagonal angle from -45°
    to +45° — creates a visual "frame" sense.
- **Heading:** `Onze clubkledij.` with italic + warm-accent on
  "clubkledij" (port the period-terminated retro-fanzine pattern).
  Replaces the current `Trainingsgear bestel je rechtstreeks bij onze
partner.` copy.
- **Subheading:** `Beschikbaar via Brandsfit, onze kledingpartner.`
  Replaces the current Dutch sales copy.
- **CTA:** `Naar de Brandsfit clubshop ↗` (single button, cream-on-jersey,
  external link). Replaces the current `Naar de webshop ↗`.
- **Eyebrow:** dropped. The current `Webshop · onze partner` MonoLabel
  retires — Brandsfit is now surfaced in the subheading and CTA.
- **Flourish:** small `<JerseyShirt>` illustration top-right (R6.C
  pick). ~140px wide · corner-anchored · no caption.

### Implementation impact on `WebshopBanner.tsx`

The current `apps/web/src/components/home/WebshopBanner/WebshopBanner.tsx`
ships:

```typescript
<MonoLabel size="md" tone="cream">
  Webshop · onze partner
</MonoLabel>

<EditorialHeading
  emphasis={{ text: "Trainingsgear", tone: "warm" }}
>
  Trainingsgear bestel je rechtstreeks bij onze partner.
</EditorialHeading>

<p>Trainingskledij, clubpakketten…</p>

<LinkButton>Naar de webshop ↗</LinkButton>
```

R6 replaces with:

```typescript
{/* eyebrow dropped */}

<EditorialHeading
  emphasis={{ text: "clubkledij", tone: "warm" }}
>
  Onze clubkledij.
</EditorialHeading>

<p>Beschikbaar via Brandsfit, onze kledingpartner.</p>

<LinkButton>Naar de Brandsfit clubshop ↗</LinkButton>

<JerseyShirt
  className="absolute top-8 right-8 w-[140px]"
  aria-hidden
/>
```

Plus the mirrored `<StripedSeam>` bands rendered as siblings of the
`<TapedCard>` or as part of the section wrapper. Implementation path
TBD at PR time — likely sibling for cleanest layering.

### Component name

Per the audit, the component should be renamed `<ClubshopBanner>`
(from `<WebshopBanner>`) to reflect the new branding. The "webshop"
generic term retires entirely:

- Component: `WebshopBanner` → `ClubshopBanner`
- Section key in page.tsx: `webshopSection` → `clubshopSection`
- Analytics event: `webshop_banner_impression` →
  `clubshop_banner_impression`; same for click event.
- `EXTERNAL_LINKS.webshop` → `EXTERNAL_LINKS.brandsfit`.

## Rationale for accepting the JerseyShirt despite brief's "no product images"

Brief §10 says: "No product images — we don't have a CMS shop, and we
don't have usable photos of clothing. Don't fake it with stock imagery."
This is a directive against PHOTOGRAPHS of clothing. A small illustrated
jersey in the existing design-system vocabulary is:

1. Not a photograph (no stock imagery used).
2. Not centered as a product (corner-anchored, ~12% of section width).
3. Reuses the existing `<JerseyShirt>` from
   `project_jersey_illustration_vocabulary` — two-pass print style,
   abstract, no sponsor logos, no realism.

The illustration reads as decorative paper graphic (matching the
overall fanzine vocabulary), not as a product display.

If a future review pushes back on this interpretation, R6.A (no
flourish at all) is the fallback — the stripe bands alone carry the
section identity.

## JerseyShirt sizing & placement details

- `width: 140px` (approximately — implementation may tune to
  `w-32` / `w-36` / `w-40` Tailwind tokens for token-discipline).
- `position: absolute` top-right of the inner container, with
  `top-8 right-8` spacing (~32px from edges).
- `aria-hidden="true"` — decorative; not announced to AT.
- Behind-the-text z-index — heading and subheading layer above if
  any overlap occurs at narrow widths.
- Mobile (<640px): hide the illustration entirely; section reads as
  R6.A would. Avoids tight-corner overlap with H2 wrap.

## Analytics

The existing `webshop_banner_impression` and `webshop_banner_cta_click`
events get renamed to `clubshop_banner_impression` and
`clubshop_banner_cta_click`. GA4 custom dimension list needs the
rename. GTM trigger regex stays compatible (still matches
`_banner_impression` / `_banner_cta_click` pattern).

Per `feedback_analytics_prd_requirement`: this rename is a small
analytics taxonomy change; document in the implementation PR's
analytics section.

## Implementation issue spinout

R6 implementation is a small focused issue:

1. Rename `WebshopBanner` → `ClubshopBanner` (file rename, exports,
   call site).
2. Update copy + emphasis prop.
3. Add `<JerseyShirt>` in corner.
4. Add mirrored `<StripedSeam>` top + bottom.
5. Rename analytics events.
6. Storybook + VR baselines refresh.

No data / schema work. ~1–2 hours of focused implementation.

## Open follow-ups

- **StripedSeam mirror prop.** Confirm `<StripedSeam>` supports an
  `angle` or `mirror` prop to flip the diagonal. If not, extend the
  primitive to accept it (additive change, not a parallel primitive).
- **JerseyShirt sizing tokens.** Verify the `~140px` translates to a
  clean Tailwind/`--size-*` token rather than an arbitrary value.
