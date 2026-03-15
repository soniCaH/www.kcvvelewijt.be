# Design: Design Tokens — Accent Strip, Spacing Scale, Border-Radius

**Date:** 2026-03-15
**Issue:** #809
**Epic:** #807 — Visual redesign implementation
**Reference mockup:** `docs/mockups/homepage-v2.html`

## Context

First step of the visual redesign. Establishes the token foundation all components build on. Site is not live — breaking token changes are acceptable.

## Decisions

### Colour tokens

Update `kcvv-green-dark` in place from `#4B9B48` → `#008755` (deeper, richer green matching new kit DNA). All three core aliases already exist in `@theme`:

| Tailwind class    | CSS var                      | Value                 |
| ----------------- | ---------------------------- | --------------------- |
| `kcvv-green`      | `--color-kcvv-green-DEFAULT` | `#4acf52` (unchanged) |
| `kcvv-green-dark` | `--color-kcvv-green-dark`    | `#008755` (updated)   |
| `kcvv-black`      | `--color-kcvv-black`         | `#1E2024` (unchanged) |

Update both `:root` and `@theme` blocks in `globals.css`. Also add `#008755` swatch to `Foundation/Colors` MDX.

### Section padding convention

`py-20` (80px) as the standard for all full-width page sections. 8pt-aligned. Document in `apps/web/CLAUDE.md`.

### Border-radius convention

| Context                                       | Class                      | Value |
| --------------------------------------------- | -------------------------- | ----- |
| Interactive elements (buttons, chips, badges) | `rounded-sm`               | 2px   |
| Cards (max)                                   | `rounded`                  | 4px   |
| Never use outside design system               | `rounded-lg`, `rounded-xl` | —     |

Document in `apps/web/CLAUDE.md`.

### Accent strip

A 3px `#4acf52` horizontal bar pinned to the top of every page viewport — the most aggressive brand signal in the design language.

- **Component:** `<AccentStrip />` — purely decorative, `aria-hidden="true"`
- **Position:** `fixed top-0 left-0 right-0 h-[3px] bg-kcvv-green z-[51]`
- **Placement:** Added in root `layout.tsx` before `<PageHeader />`
- **Storybook:** `Layout/AccentStrip` — Playground variant + OnDarkBackground variant

### Nav colour change (bundled from #810 preparation)

Current `PageHeader` uses an inline green background (`#4acf52`). The redesign nav is dark (`#1E2024`). Change applied here as a prerequisite for #810.

- Background: inline style → `bg-kcvv-black`
- Position: `fixed top-0` → `fixed top-[3px]` (offset below accent strip)
- Pattern image removed (was part of old green header identity)

## Files

### Create

```
apps/web/src/components/layout/AccentStrip/
  AccentStrip.tsx
  AccentStrip.stories.tsx
  index.ts
```

### Modify

```
apps/web/src/app/globals.css              — update kcvv-green-dark token
apps/web/src/app/layout.tsx              — add <AccentStrip />
apps/web/src/components/layout/
  PageHeader/PageHeader.tsx              — dark bg + top-[3px] offset
  index.ts                              — export AccentStrip
apps/web/CLAUDE.md                       — document conventions
apps/web/src/stories/foundation/Colors.mdx — add #008755 swatch
```

## Acceptance criteria

- [ ] Green accent strip visible above sticky nav on every page
- [ ] `kcvv-green-dark` token is `#008755` in both `:root` and `@theme`
- [ ] Nav background is `#1E2024`, offset `top-[3px]`
- [ ] All redesigned sections use `py-20` consistently
- [ ] Border-radius convention documented in `apps/web/CLAUDE.md`
- [ ] `AccentStrip` has a Storybook story at `Layout/AccentStrip`
- [ ] `Foundation/Colors` MDX updated with `#008755` swatch
- [ ] Build passes, lint clean
