# PRD: /club Landing Page

**Issue:** #913
**Status:** Design approved
**Mockup:** `docs/mockups/club-landing-final.html`

## 1. Problem Statement

The `/club` route prefix groups pages about the club's organisation (bestuur, organigram, contact, geschiedenis, ultras, angels), but `/club` itself returns a 404. Users navigating to `/club` — whether via the main nav or a direct link — should see a visually rich landing page that links to all sub-sections. This is a navigation concept, not a domain entity: no Sanity document type needed.

## 2. Scope

**Packages:** `apps/web` only.

**In scope:**

- Static page at `/club` with editorial card grid linking to sub-pages
- Four new components: `ClubHero`, `ClubEditorialGrid`, `MissionBanner`, `ClubContactCta`
- Storybook stories for each component

**Out of scope:**

- Sanity CMS integration (all content is hardcoded — these are navigation cards, not CMS-driven content)
- New Sanity document types
- Any BFF / api-contract changes
- Images from Sanity — use placeholder images for now; real club photos are a follow-up
- Creating the sub-pages themselves (bestuur, geschiedenis, etc. — separate issues)
- Mobile hamburger menu changes

## 3. Tracer Bullet

A static page at `/club` rendering the `ClubHero` component with hardcoded title, subtitle, and a placeholder background image, followed by a single editorial card linking to `/club/bestuur`. Uses `SectionStack` with one diagonal transition. No editorial grid, no mission banner, no contact CTA.

Proves: route works, hero-with-bleed-through-diagonal renders correctly, `SectionStack` integration is sound.

## 4. Phases

```
Phase 1: Tracer bullet — hero + single card at /club (#1030)
Phase 2: Full editorial grid + mission banner + contact CTA (#1031)
Phase 3: Storybook stories for all components (#1032)
```

## 5. Acceptance Criteria

### Phase 1 — Tracer bullet

- [ ] `/club` renders a page (not 404)
- [ ] `ClubHero` renders with background image bleeding through the diagonal
- [ ] At least one editorial card links to a `/club/*` sub-page
- [ ] Page uses `SectionStack` for section orchestration
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2 — Full page

- [ ] Editorial grid renders all 6 cards in the correct asymmetric layout (7/5/5/4/4/4 columns)
- [ ] Grid collapses responsively: 2-col at `≤960px`, 1-col at `≤640px`
- [ ] Mission banner section renders between diagonal transitions
- [ ] Contact CTA bar renders with inline layout (text left, button right)
- [ ] Contact CTA collapses to stacked/centered layout on mobile
- [ ] All links point to correct `/club/*` routes
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3 — Storybook

- [ ] `ClubHero` story under `Features/Club/ClubHero`
- [ ] `ClubEditorialGrid` story under `Features/Club/ClubEditorialGrid`
- [ ] `MissionBanner` story under `Features/Club/MissionBanner`
- [ ] `ClubContactCta` story under `Features/Club/ClubContactCta`
- [ ] All stories use `StoryObj<typeof meta>` pattern with `fn()` handlers
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. This is a purely static page with no data fetching.

## 7. Page Structure (SectionStack)

The page uses `SectionStack` but with a twist: the hero section's background image must bleed through the diagonal transition into the editorial section. This requires a custom approach — see Section 1 details below.

### Section 1 — Club Hero (with bleed-through diagonal)

| Property        | Value                                      |
| --------------- | ------------------------------------------ |
| `bg`            | `"kcvv-black"`                             |
| `paddingTop`    | `"pt-0"`                                   |
| `paddingBottom` | `"pb-0"`                                   |
| `transition`    | `{ type: "diagonal", direction: "right" }` |

**Component:** `ClubHero` (new)

#### Bleed-through diagonal pattern

The hero background image must visibly extend through the diagonal cut into the next section. In the mockup this is achieved by wrapping both the hero content and the diagonal SVG in a single container, so the absolutely-positioned background image spans both.

**Implementation approach:** The `ClubHero` component renders its own built-in diagonal at the bottom. The `SectionStack` transition for this section should use `overlap="full"` so the `from` triangle becomes `transparent` (this is already supported by `SectionTransition` — see line 158 of `SectionTransition.tsx`). The hero's internal diagonal uses a taller height for dramatic effect.

Alternatively, if `SectionStack` cannot cleanly support this, the hero component renders completely outside `SectionStack` and the stack begins from section 2 onward. **Ralph should try the `overlap="full"` approach first.**

#### Background layers (stacked with `absolute inset-0`, inside a wrapper `div`)

1. Background image: `next/image` with `fill`, `object-cover`, `object-[center_30%]`, CSS filter `brightness(0.25) saturate(0.7)` (use inline `style` — NOT a Tailwind class, Tailwind does not support combined filter values)
2. Gradient overlay: `bg-gradient-to-b from-kcvv-black/20 via-kcvv-black/40 via-40% to-kcvv-black/85` with an additional green tint at 70% — use inline style for the complex gradient:

```css
background: linear-gradient(
  to bottom,
  rgba(30, 32, 36, 0.2) 0%,
  rgba(30, 32, 36, 0.4) 40%,
  rgba(0, 135, 85, 0.25) 70%,
  rgba(30, 32, 36, 0.85) 100%
);
```

#### Hero content

Container: `relative z-10 min-h-[60vh] flex items-end`
Inner: `max-w-[70rem] mx-auto px-4 md:px-10 py-10 md:py-16 w-full`

| Element             | Tailwind classes                                                                                         | Notes                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Label ("Onze club") | `flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-white/50 mb-6` | Preceded by `<span className="block w-5 h-0.5 bg-kcvv-green" />` |
| Title               | `font-title font-black text-white uppercase leading-[0.9] mb-6`                                          | `style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}`               |
| Title green accent  | "compagnie" wrapped in `<span className="text-kcvv-green">`                                              | Renders as: "DE PLEZANTSTE" `<br>` "COMPAGNIE" (white + green)   |
| Subtitle            | `text-[1.0625rem] text-white/60 leading-[1.7] max-w-[32rem]`                                             | Body font (default), not title font                              |

#### Built-in diagonal (inside hero wrapper)

Height: `clamp(3rem, 8vw, 7rem)` — taller than standard `clamp(2rem, 6vw, 5rem)` for dramatic effect.

SVG: `viewBox="0 0 100 100"` with `preserveAspectRatio="none"`:

- Upper-right triangle: `fill="transparent"` (hero bg shows through)
- Lower-left triangle: `fill="#f3f4f6"` (gray-100, matches editorial section)

Direction: right (diagonal goes ↘).

### Section 2 — Editorial Grid

| Property        | Value                                     |
| --------------- | ----------------------------------------- |
| `bg`            | `"gray-100"`                              |
| `paddingTop`    | `"pt-20"`                                 |
| `paddingBottom` | `"pb-20"`                                 |
| `transition`    | `{ type: "diagonal", direction: "left" }` |

**Component:** `ClubEditorialGrid` (new)

Inside `max-w-[70rem] mx-auto px-4 md:px-10`:

#### Section header

| Element          | Tailwind classes                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header label     | `flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-kcvv-gray mb-3` with green dash `<span className="block w-5 h-0.5 bg-kcvv-green" />` |
| Header title     | `font-title font-extrabold text-kcvv-gray-blue` at `style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}`                                                                          |
| Header container | `mb-12`                                                                                                                                                                        |

**Note:** Do NOT use the existing `<SectionHeader>` component here — it has `variant="light"|"dark"` but uses a left green border. The mockup uses a label + green dash above the title instead, which is a different pattern. Create the header inline within `ClubEditorialGrid`.

#### Editorial card grid

12-column CSS grid: `grid grid-cols-12 gap-5` (gap = `1.25rem`)

Grid template rows: `grid-rows-[auto_auto_auto]`

| Card                    | Grid position (desktop)                                    | `min-height` |
| ----------------------- | ---------------------------------------------------------- | ------------ |
| Featured (Geschiedenis) | `col-span-7 row-span-2` (columns 1–7, rows 1–2)            | `520px`      |
| Medium 1 (Bestuur)      | `col-start-8 col-span-5 row-start-1` (columns 8–12, row 1) | `280px`      |
| Medium 2 (Organigram)   | `col-start-8 col-span-5 row-start-2` (columns 8–12, row 2) | `280px`      |
| Third 1 (Ultras)        | `col-span-4 row-start-3` (columns 1–4, row 3)              | `280px`      |
| Third 2 (Angels)        | `col-span-4 row-start-3` (columns 5–8, row 3)              | `280px`      |
| Third 3 (Aansluiten)    | `col-span-4 row-start-3` (columns 9–12, row 3)             | `280px`      |

#### Responsive grid behavior

```css
/* ≤960px: 2-col, featured full-width */
@media (max-width: 960px) {
  grid-cols-2, all cards: col-auto row-auto min-h-[260px]
  featured: col-span-full min-h-[320px]
}

/* ≤640px: single column */
@media (max-width: 640px) {
  grid-cols-1
  featured: min-h-[280px]
}
```

#### Editorial card anatomy (reusable inner component: `EditorialCard`)

Each card is an `<a>` (Next.js `<Link>`) with these layers:

| Layer            | Implementation                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Container        | `relative overflow-hidden rounded-sm flex flex-col justify-end transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]`               |
| Background image | `absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105` — use `<div>` with inline `backgroundImage` style (placeholder URLs for now) |
| Gradient overlay | `absolute inset-0` with `background: linear-gradient(to top, rgba(30,32,36,0.95) 0%, rgba(30,32,36,0.5) 40%, rgba(30,32,36,0.1) 100%)`                                     |
| Content          | `relative z-10 p-6` (featured: `p-10`)                                                                                                                                     |

Content elements per card:

| Element          | Tailwind classes                                                                                                                                        | Notes                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Tag              | `text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-kcvv-green mb-2`                                                                       | e.g. "Geschiedenis", "Bestuur"             |
| Title            | `font-title font-extrabold text-white uppercase leading-[1.1] mb-2`                                                                                     | Default: `text-xl` (1.25rem)               |
| Title (featured) | `font-title font-extrabold text-white uppercase leading-[1.1] mb-2` at `style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}`                            | Larger for featured card                   |
| Description      | `text-[0.8125rem] text-white/55 leading-normal`                                                                                                         | Optional — only on featured + medium cards |
| Arrow link       | `inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-kcvv-green mt-3 transition-[gap] duration-200 group-hover:gap-2.5` | e.g. "Lees meer →"                         |

#### Card content (hardcoded)

| Position | Route                | Tag          | Title                            | Description                                                                                                            | Arrow text      |
| -------- | -------------------- | ------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------- |
| Featured | `/club/geschiedenis` | Geschiedenis | 75 jaar voetbalpassie in Elewijt | Van een bescheiden begin op een modderig veld tot een bruisende club met honderden leden. Ontdek het verhaal van KCVV. | Lees meer →     |
| Medium 1 | `/club/bestuur`      | Bestuur      | Het team achter het team         | Maak kennis met het bestuur dat de club draaiende houdt.                                                               | Ontdek →        |
| Medium 2 | `/club/organigram`   | Organigram   | Onze structuur                   | Van voorzitter tot jeugdcoördinator — wie doet wat?                                                                    | Bekijk →        |
| Third 1  | `/club/ultras`       | Ultras       | De 12de man                      | _(none)_                                                                                                               | Meer info →     |
| Third 2  | `/club/angels`       | Angels       | Onze engelen                     | _(none)_                                                                                                               | Meer info →     |
| Third 3  | `/club/aansluiten`   | Aansluiten   | Word lid                         | _(none)_                                                                                                               | Schrijf je in → |

### Section 3 — Mission Banner

| Property        | Value                                      |
| --------------- | ------------------------------------------ |
| `bg`            | `"kcvv-green-dark"`                        |
| `paddingTop`    | `"pt-20"`                                  |
| `paddingBottom` | `"pb-20"`                                  |
| `transition`    | `{ type: "diagonal", direction: "right" }` |

**Component:** `MissionBanner` (new)

Inside `max-w-[50rem] mx-auto px-4 md:px-10 text-center`:

| Element     | Tailwind classes                                                                                                | Content                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Quote icon  | `text-5xl text-white/20 mb-6 font-serif leading-none`                                                           | `"` (opening double quote, use `font-family: Georgia, serif` via inline style)                                  |
| Quote text  | `font-title font-bold text-white leading-normal mb-6` at `style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}` | "Wij zijn KCVV Elewijt. Een plek waar jong en oud samenkomen, waar passie voor voetbal het hele dorp verbindt." |
| Attribution | `text-[0.8125rem] font-semibold text-white/50 uppercase tracking-[0.08em]`                                      | "— Sportpark Elewijt, sinds 1948"                                                                               |

### Section 4 — Contact CTA

| Property        | Value          |
| --------------- | -------------- |
| `bg`            | `"kcvv-black"` |
| `paddingTop`    | `"pt-16"`      |
| `paddingBottom` | `"pb-16"`      |

**No transition after** — this is the last section before the footer.

**Component:** `ClubContactCta` (new)

Inside `max-w-[70rem] mx-auto px-4 md:px-10`:

Layout: `grid grid-cols-[1fr_auto] items-center gap-8` (collapses to `grid-cols-1 text-center` at `≤640px`)

| Element    | Tailwind classes                                                                                                                                                                                  | Content                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Title      | `font-title font-extrabold text-white mb-2` at `style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}`                                                                                             | "Vragen over de club?"                         |
| Body text  | `text-[0.9375rem] text-white/50`                                                                                                                                                                  | "Neem contact op — we helpen je graag verder." |
| CTA button | `inline-flex items-center gap-2 px-8 py-3.5 bg-kcvv-green text-kcvv-black font-bold text-sm uppercase tracking-[0.06em] rounded-sm whitespace-nowrap transition-colors hover:bg-kcvv-green-hover` | "Contacteer ons →" — links to `/club/contact`  |

## 8. Component File Structure

```
apps/web/src/
├── app/(main)/club/
│   └── page.tsx                              # Server component, static, SectionStack
├── components/club/
│   ├── ClubHero/
│   │   ├── ClubHero.tsx
│   │   └── ClubHero.stories.tsx              # Features/Club/ClubHero
│   ├── ClubEditorialGrid/
│   │   ├── ClubEditorialGrid.tsx
│   │   ├── EditorialCard.tsx                 # Internal sub-component (not exported from barrel)
│   │   └── ClubEditorialGrid.stories.tsx     # Features/Club/ClubEditorialGrid
│   ├── MissionBanner/
│   │   ├── MissionBanner.tsx
│   │   └── MissionBanner.stories.tsx         # Features/Club/MissionBanner
│   └── ClubContactCta/
│       ├── ClubContactCta.tsx
│       └── ClubContactCta.stories.tsx        # Features/Club/ClubContactCta
```

## 9. Existing Component Reuse

| Component           | Reuse?    | Notes                                                                                                                                                                                  |
| ------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SectionStack`      | **Yes**   | Orchestrates all sections with bg colors and transitions                                                                                                                               |
| `SectionTransition` | **Yes**   | Standard diagonal transitions between sections 2→3→4. Hero diagonal is custom (taller, bleed-through) but try `overlap="full"` first                                                   |
| `SectionHeader`     | **No**    | Mockup uses a different header pattern (label + green dash above title, no left border). Create inline.                                                                                |
| `Button`            | **Maybe** | The CTA buttons in the mockup have specific styling. If `Button` with `variant="primary"` + `withArrow` matches, use it. Otherwise, style the `<Link>` directly. Ralph should compare. |
| `Card`              | **No**    | The editorial cards have a completely different anatomy (photo bg, gradient overlay, hover zoom) from the design system `Card`. Create `EditorialCard` as a new internal component.    |

## 10. Design Token Reference

Do NOT hardcode hex values — use Tailwind classes that reference `@theme` tokens.

| Token        | Tailwind class                      | Hex              |
| ------------ | ----------------------------------- | ---------------- |
| Green bright | `text-kcvv-green` / `bg-kcvv-green` | `#4acf52`        |
| Green dark   | `bg-kcvv-green-dark`                | `#008755`        |
| Green hover  | `hover:bg-kcvv-green-hover`         | `#41b147`        |
| Black        | `bg-kcvv-black` / `text-kcvv-black` | `#1E2024`        |
| Gray blue    | `text-kcvv-gray-blue`               | `#31404b`        |
| Gray         | `text-kcvv-gray`                    | `#62656A`        |
| Gray 100     | `bg-gray-100`                       | `#f3f4f6`        |
| Title font   | `font-title`                        | quasimoda stack  |
| Body font    | `font-body` (default)               | montserrat stack |

### Opacity patterns (on dark backgrounds)

| Purpose            | Class                                       |
| ------------------ | ------------------------------------------- |
| Primary text       | `text-white`                                |
| Secondary/subtitle | `text-white/60`                             |
| Tertiary/label     | `text-white/50`                             |
| Muted/subtle       | `text-white/55`                             |
| Quote icon         | `text-white/20`                             |
| Decorative dash    | `bg-kcvv-green` (not white/30 — green dash) |
| Card bg            | Not applicable (these are image cards)      |

### Typography scale (all `clamp` values and fixed sizes)

| Element                | Font size                      | Weight                 | Family           | Line height |
| ---------------------- | ------------------------------ | ---------------------- | ---------------- | ----------- |
| Hero title             | `clamp(3rem, 7vw, 5.5rem)`     | `font-black` (900)     | `font-title`     | `0.9`       |
| Hero subtitle          | `1.0625rem` (17px)             | normal (400)           | default (body)   | `1.7`       |
| Hero/header label      | `0.6875rem` (11px)             | `font-extrabold` (800) | default (body)   | default     |
| Editorial header title | `clamp(1.5rem, 3vw, 2rem)`     | `font-extrabold` (800) | `font-title`     | default     |
| Card tag               | `0.625rem` (10px)              | `font-extrabold` (800) | default (body)   | default     |
| Card title (default)   | `1.25rem` (20px)               | `font-extrabold` (800) | `font-title`     | `1.1`       |
| Card title (featured)  | `clamp(1.5rem, 3vw, 2.25rem)`  | `font-extrabold` (800) | `font-title`     | `1.1`       |
| Card description       | `0.8125rem` (13px)             | normal (400)           | default (body)   | `1.5`       |
| Card arrow             | `0.75rem` (12px)               | `font-bold` (700)      | default (body)   | default     |
| Mission quote          | `clamp(1.25rem, 3vw, 1.75rem)` | `font-bold` (700)      | `font-title`     | `1.5`       |
| Mission quote icon     | `3rem` (48px)                  | normal                 | `Georgia, serif` | `1`         |
| Mission attribution    | `0.8125rem` (13px)             | `font-semibold` (600)  | default (body)   | default     |
| Contact CTA title      | `clamp(1.25rem, 3vw, 1.75rem)` | `font-extrabold` (800) | `font-title`     | default     |
| Contact CTA body       | `0.9375rem` (15px)             | normal (400)           | default (body)   | default     |
| Contact CTA button     | `0.875rem` (14px)              | `font-bold` (700)      | default (body)   | default     |

### Letter spacing

| Element         | Value    | Tailwind            |
| --------------- | -------- | ------------------- |
| Labels          | `0.14em` | `tracking-[0.14em]` |
| Card tags       | `0.14em` | `tracking-[0.14em]` |
| Card arrow      | `0.08em` | `tracking-[0.08em]` |
| CTA buttons     | `0.06em` | `tracking-[0.06em]` |
| Mission attrib. | `0.08em` | `tracking-[0.08em]` |

## 11. Metadata

```typescript
export const metadata: Metadata = {
  title: "Onze club | KCVV Elewijt",
  description:
    "Alles over KCVV Elewijt: geschiedenis, bestuur, organigram en hoe je kan aansluiten.",
};
```

## 12. Open Questions

- [ ] **Images:** Which real club photos to use for hero bg and editorial cards? — Needs your decision. Use Unsplash placeholders until then.
- [ ] **Sub-page routes:** Do `/club/geschiedenis`, `/club/ultras`, `/club/angels`, `/club/aansluiten` exist yet? If not, cards will link to 404s. — Check during implementation; may need stub pages or a note that these are upcoming.
- [ ] **`SectionStack` bleed-through:** Can `overlap="full"` on the hero's transition produce the mockup's bleed-through effect, or does the hero need to render completely outside `SectionStack`? — Will be answered by tracer bullet.

## 13. Discovered Unknowns (filled during implementation)

_Empty — to be updated during Ralph loop._
