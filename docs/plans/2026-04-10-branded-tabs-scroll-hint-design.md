# BrandedTabs Touch Affordance & Scroll Hint Unification

**Issue:** #1260
**Date:** 2026-04-10

## Problem

1. BrandedTabs has no touch pressed state and inactive tabs have low contrast
2. Three components independently implement scroll overflow hints with two different patterns
3. No shared utility for scroll overflow detection

## Design

### Part A: BrandedTabs Touch Affordance

**Changes to `BrandedTabs.tsx`:**

- **Pressed state:** Add `active:scale-[0.98] active:bg-kcvv-green-dark/10` to tab buttons for mobile touch feedback
- **Inactive contrast:** Change inactive text from `text-kcvv-gray` to a higher-contrast color meeting WCAG AA on both light and dark backgrounds
- **Active indicator:** The existing `border-b-4 border-kcvv-green-bright` serves as the active underline — add a transition for smooth tab switching
- **Keyboard focus:** Preserve existing `focus-visible:ring-2` behavior

### Part B: `useScrollHint` Hook

**Location:** `apps/web/src/components/design-system/ScrollHint/useScrollHint.ts`

```typescript
interface UseScrollHintReturn {
  scrollRef: React.RefObject<HTMLElement>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  scrollLeft: () => void;
  scrollRight: () => void;
}

function useScrollHint(): UseScrollHintReturn;
```

**Internals:**

- `ResizeObserver` on the scroll container for overflow detection
- `scroll` event listener for position tracking
- 10px dead-zone threshold (matching FilterTabs behavior)
- Cleanup on unmount

**Consumers:**

| Component      | Mode     | Rendering                                               |
| -------------- | -------- | ------------------------------------------------------- |
| BrandedTabs    | arrows   | `<ScrollArrowButton>` at left/right edges               |
| FilterTabs     | arrows   | Refactor to use `useScrollHint` instead of inline logic |
| HtmlTableBlock | gradient | Uses `canScrollRight` to show gradient overlay          |

### `ScrollArrowButton` Component

**Location:** `apps/web/src/components/design-system/ScrollHint/ScrollArrowButton.tsx`

Presentational component for the arrow buttons. Extracted from FilterTabs's existing arrow UI.

```typescript
interface ScrollArrowButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  variant?: "light" | "dark";
}
```

### File Structure

```text
apps/web/src/components/design-system/ScrollHint/
├── useScrollHint.ts
├── useScrollHint.test.ts
├── ScrollArrowButton.tsx
├── ScrollArrowButton.stories.tsx
└── index.ts
```

## Testing Strategy

- Unit tests for `useScrollHint` — mock `scrollWidth`/`clientWidth` on container, verify `canScrollLeft`/`canScrollRight` state
- Update BrandedTabs tests — verify touch affordance classes, scroll arrow rendering
- Update FilterTabs tests — verify behavior preserved after refactor to shared hook
- Verify HtmlTableBlock gradient still works with shared hook

## Consumers Audit

- `BrandedTabs` — used only by `TeamDetailTabs` (team detail page)
- `FilterTabs` — used by news category filters, sponsor tier filters
- `HtmlTableBlock` — used in Sanity article body rendering
