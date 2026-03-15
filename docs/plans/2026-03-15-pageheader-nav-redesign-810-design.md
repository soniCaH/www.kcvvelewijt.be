# PageHeader Nav Redesign — Design Doc

**Issue:** #810 `feat(redesign): PageHeader — real logo, search icon, nav utility group`
**Epic:** #807 Visual Redesign
**Branch:** `feat/redesign-design-tokens-809`
**Date:** 2026-03-15

## Overview

Restructure the `PageHeader` to match the v2 mockup: smaller logo, flat nav height, desktop utility group (search icon + "Word lid" CTA), and a green active-state underline replacing the white one.

## Layout & Structure

### Desktop (`lg+`)

Single-row, `h-16` (64px), offset `top-[3px]` (unchanged — AccentStrip clears).

```
[Logo h-10 w-auto] ———————————— [Nav items] [Search icon] [Word lid button]
```

### Mobile (`< lg`)

Same height `h-16`. Hamburger and search icon stay in the mobile header bar.

```
[Hamburger] ——— [Logo h-10 w-auto centered] ——— [Search icon]
```

## Visual Specifications

| Element               | Spec                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nav height            | `h-16` (64px) — flat, no breakpoint change                                                                                                            |
| Nav offset            | `top-[3px]` (unchanged)                                                                                                                               |
| Spacer                | `h-[calc(4rem+3px)]`                                                                                                                                  |
| Logo                  | `h-10 w-auto`                                                                                                                                         |
| Active underline      | `#4acf52` (`kcvv-green-bright`) — replaces white                                                                                                      |
| Hover animation       | Existing slide-in underline, recolored green                                                                                                          |
| Search icon (desktop) | Plain icon, `text-white/70 hover:text-white transition-colors`, no border                                                                             |
| "Word lid" button     | `border border-kcvv-green/60 text-white text-sm font-semibold px-4 py-1.5 rounded-sm hover:border-kcvv-green hover:text-kcvv-green transition-colors` |
| "Word lid" href       | `/club/register`                                                                                                                                      |

## Component Changes

### `Navigation.tsx`

- Remove search icon from the nav `<ul>` list items (moves to `PageHeader` utility group)
- Update `dangerouslySetInnerHTML` CSS: active underline color `#fff` → `#4acf52`
- Keep existing slide-in underline hover animation unchanged

### `PageHeader.tsx`

- Nav: `h-20 lg:h-[7.5rem]` → `h-16`
- Spacer: `h-[calc(5rem+3px)] lg:h-[calc(7.5rem+3px)]` → `h-[calc(4rem+3px)]`
- Desktop logo: `width={112} h-28` → `h-10 w-auto`
- Mobile logo: `width={100} w-[100px]` → `h-10 w-auto`, reposition centering calc
- Mobile hamburger/search vertical centering: recalculate for `h-16` (`h-[calc(4rem-16px)/2]`)
- Add desktop utility group (right of `<Navigation />`):
  - Search icon: `<Link href="/search">` with `text-white/70 hover:text-white transition-colors`
  - "Word lid" button: `<Link href="/club/register">` with outlined style

### `PageHeader.stories.tsx`

- Update content spacer padding: `pt-[calc(7.5rem+3px)]` → `pt-[calc(4rem+3px)]`
- MobileView spacer: `pt-[calc(5rem+3px)]` → `pt-[calc(4rem+3px)]`

### `PageHeader.test.tsx`

- Update height class assertion: `h-20` → `h-16`
- Add tests: utility group renders search link, "Word lid" button renders with correct href

## Testing

- All existing PageHeader tests must continue to pass
- New assertions:
  - Nav has class `h-16`
  - Desktop utility group contains search link (`/search`)
  - Desktop utility group contains "Word lid" link (`/club/register`)
- Storybook: visual verification in Default + WithContent stories

## Out of Scope

- Mobile menu redesign
- "Word lid" button may be removed in a future ticket — keep it isolated so deletion is a one-liner
