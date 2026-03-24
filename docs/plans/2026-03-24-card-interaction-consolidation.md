# Card Interaction Consolidation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Standardize card hover/shadow/lift/radius/accent across the entire site so every card _feels_ the same, then delete the unused DS Card component.

**Architecture:** No new Card wrapper component. Instead, define shared interaction tokens in `globals.css` and apply consistent utility classes to each card component individually. A new Foundation MDX page documents the standard.

**Tech Stack:** Tailwind v4 `@theme` tokens, existing component files, Storybook MDX

---

## Canonical card interaction classes

Every hoverable card MUST use these classes (or the subset appropriate to its context):

```
rounded-card                                    /* 4px — already a token */
transition-all duration-300                     /* consistent timing */
hover:-translate-y-1                            /* lift */
hover:shadow-card-hover                         /* soft elevated shadow */
```

Every hoverable card with a link SHOULD include the green top-border accent:

```html
<div
  className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none
             [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)]
             transition-[clip-path] duration-300 ease-out"
  aria-hidden="true"
/>
```

Image hover zoom (where applicable):

```
transition-transform duration-500 group-hover:scale-105
```

### Exceptions

- **MatchTeaser / MatchResultRow**: These are compact list rows, not cards. They keep `hover:shadow-md` (subtle) and no lift/accent. Only update `rounded` → `rounded-card`.
- **SponsorCard**: Uses grayscale filter toggle, no shadow/lift. Keep as-is.
- **RelatedContentCard**: Fixed-width slider card with border highlight. Apply `rounded-card`, add accent bar, keep `hover:border-kcvv-green-bright`.

---

### Task 1: Delete unused design-system Card

**Files:**

- Delete: `src/components/design-system/Card/Card.tsx`
- Delete: `src/components/design-system/Card/Card.test.tsx`
- Delete: `src/components/design-system/Card/Card.stories.tsx`
- Delete: `src/components/design-system/Card/index.ts`
- Modify: `src/components/design-system/index.ts` — remove Card exports

**Step 1: Verify no production imports**

Run: `grep -r "from.*design-system/Card\|from.*design-system.*Card" src/ --include="*.tsx" --include="*.ts" | grep -v stories | grep -v test | grep -v "\.d\.ts"`

Expected: Only `index.ts` barrel and the Spinner story (which uses CardContent for demo — will need a div replacement).

**Step 2: Check Spinner story**

Read: `src/components/design-system/Spinner/Spinner.stories.tsx`
If it imports Card/CardContent, replace with a plain `<div>` wrapper.

**Step 3: Delete Card directory**

```bash
rm -rf src/components/design-system/Card/
```

**Step 4: Remove Card exports from barrel**

In `src/components/design-system/index.ts`, remove lines:

```typescript
export { Card, CardHeader, CardContent, CardFooter, CardImage } from "./Card";
export type {
  CardProps,
  CardVariant,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardImageProps,
} from "./Card";
```

**Step 5: Run type-check and tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: All pass

**Step 6: Commit**

```
feat(ui): delete unused design-system Card component (#1031)
```

---

### Task 2: Update Foundation docs — add shadow-card-hover + tracking tokens to SpacingAndIcons MDX

**Files:**

- Modify: `src/stories/foundation/SpacingAndIcons.mdx` — add `shadow-card-hover` to shadows table
- Modify: `src/stories/foundation/Typography.mdx` — add `tracking-label` and `tracking-caps` to a new Letter Spacing section

**Step 1: Add shadow-card-hover to shadows table**

In `src/stories/foundation/SpacingAndIcons.mdx`, in the Shadows `<table>`, add a row after `shadow-lg`:

```html
<tr>
  <td><code>shadow-card-hover</code></td>
  <td>Card hover state (<code>0 12px 32px rgba(0,0,0,0.15)</code>)</td>
</tr>
```

**Step 2: Add letter spacing section to Typography MDX**

In `src/stories/foundation/Typography.mdx`, add after the Line Heights section:

```markdown
## Letter Spacing

<table>
  <thead><tr><th>Token</th><th>Value</th><th>Usage</th></tr></thead>
  <tbody>
    <tr><td><code>tracking-label</code></td><td>0.14em</td><td>Uppercase kicker / label text</td></tr>
    <tr><td><code>tracking-caps</code></td><td>0.08em</td><td>Uppercase links / footer captions</td></tr>
  </tbody>
</table>
```

**Step 3: Verify Storybook builds**

Run: `npx storybook build --quiet 2>&1 | tail -5` (or just check no syntax errors)

**Step 4: Commit**

```
docs(ui): add shadow-card-hover and tracking tokens to Foundation stories (#1031)
```

---

### Task 3: Standardize NewsCard

**Files:**

- Modify: `src/components/article/NewsCard/NewsCard.tsx`

NewsCard already has: `hover:-translate-y-1`, `duration-300`, green accent bar. Needs:

- `rounded` → `rounded-card`
- `hover:shadow-xl` → `hover:shadow-card-hover`

**Step 1: Update listing variant (line ~50)**

Change: `"relative group overflow-hidden rounded bg-white flex flex-col h-full"`
To: `"relative group overflow-hidden rounded-card bg-white flex flex-col h-full"`

Change: `"transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"`
To: `"transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"`

**Step 2: Update featured variant (line ~125)**

Change: `"relative group overflow-hidden rounded bg-kcvv-black"`
To: `"relative group overflow-hidden rounded-card bg-kcvv-black"`

Change: `"transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"`
To: `"transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"`

**Step 3: Run tests**

Run: `npx vitest run src/components/article/NewsCard/`
Expected: All pass

**Step 4: Commit**

```
refactor(ui): standardize NewsCard hover to card tokens (#1031)
```

---

### Task 4: Standardize EditorialCard

**Files:**

- Modify: `src/components/club/EditorialCard/EditorialCard.tsx`

Already has: `hover:-translate-y-1`, `hover:shadow-card-hover`, `duration-300`. Needs:

- `rounded-sm` → `rounded-card`
- Add green accent bar

**Step 1: Update border-radius**

Change: `rounded-sm` → `rounded-card` in the Link className (line ~25)

**Step 2: Add green accent bar**

After the gradient overlay div (line ~40), inside the Link, add:

```tsx
<div
  className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
  aria-hidden="true"
/>
```

**Step 3: Run tests**

Run: `npx vitest run src/components/club/EditorialCard/`
Expected: All pass

**Step 4: Commit**

```
refactor(ui): standardize EditorialCard hover to card tokens (#1031)
```

---

### Task 5: Standardize PlayerCard + TeamCard

**Files:**

- Modify: `src/components/player/PlayerCard/PlayerCard.tsx`
- Modify: `src/components/team/TeamCard/TeamCard.tsx`

Both currently have: `rounded-sm`, `shadow-sm`, `hover:shadow-lg`, `duration-200`, no lift, no accent.
Change to: `rounded-card`, `shadow-sm`, `hover:shadow-card-hover`, `duration-300`, `hover:-translate-y-1`, green accent bar.

**Step 1: Update PlayerCard**

In the Link className block (lines ~114-119):

- `rounded-sm` → `rounded-card`
- `"transition-shadow duration-200 ease-out"` → `"transition-all duration-300"`
- `"hover:shadow-lg"` → `"hover:shadow-card-hover"`, `"hover:-translate-y-1"`

Add green accent bar as first child inside the Link (before the image container):

```tsx
<div
  className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
  aria-hidden="true"
/>
```

Also update the loading skeleton: `rounded-sm` → `rounded-card`

**Step 2: Update TeamCard — same changes**

Same pattern as PlayerCard. Update Link className and loading skeleton.

**Step 3: Run tests**

Run: `npx vitest run src/components/player/PlayerCard/ src/components/team/TeamCard/`
Expected: All pass

**Step 4: Commit**

```
refactor(ui): standardize PlayerCard + TeamCard hover to card tokens (#1031)
```

---

### Task 6: Standardize EventCard

**Files:**

- Modify: `src/components/event/EventCard/EventCard.tsx`

Currently: `rounded-sm`, `hover:shadow-lg`, `duration-200`, no lift, no accent.

**Step 1: Update EventCard**

In the Link className (lines ~44-48):

- `rounded-sm` → `rounded-card`
- `"transition-shadow duration-200 hover:shadow-lg"` → `"transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"`

Add green accent bar inside the Link wrapper, before existing content:

```tsx
<div
  className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
  aria-hidden="true"
/>
```

Note: EventCard uses `overflow-hidden` so the accent is already clipped properly.

**Step 2: Run tests**

Run: `npx vitest run src/components/event/EventCard/`
Expected: All pass

**Step 3: Commit**

```
refactor(ui): standardize EventCard hover to card tokens (#1031)
```

---

### Task 7: Standardize SponsorsTier cards

**Files:**

- Modify: `src/components/sponsors/SponsorsTier.tsx`

Currently: `rounded`, `hover:shadow-xl hover:scale-105 hover:-translate-y-1`, `duration-300`.
Drop scale, standardize shadow/radius.

**Step 1: Update sponsor card container (lines ~98-105)**

- `rounded` → `rounded-card`
- `"hover:shadow-xl hover:scale-105 hover:-translate-y-1"` → `"hover:shadow-card-hover hover:-translate-y-1"`

Add green accent bar inside the card container (before existing children).

**Step 2: Run tests**

Run: `npx vitest run src/components/sponsors/`
Expected: All pass

**Step 3: Commit**

```
refactor(ui): standardize SponsorsTier cards to card tokens (#1031)
```

---

### Task 8: Standardize ContactCard

**Files:**

- Modify: `src/components/organigram/shared/ContactCard.tsx`

Currently: `rounded-xl`, `hover:shadow-md`, `hover:-translate-y-1` (only when clickable), `duration-300`.

**Step 1: Update ContactCard (lines ~65-73)**

- `rounded-xl` → `rounded-card`
- `hover:shadow-md` → `hover:shadow-card-hover`
- Keep the conditional `hover:-translate-y-1` for clickable cards, but add it to non-clickable too (all cards lift)

Actually — ContactCard can be non-interactive (no onClick). For non-interactive cards, keep no hover effects. Only update:

- `rounded-xl` → `rounded-card`
- When clickable: `hover:shadow-md` → `hover:shadow-card-hover`

No green accent on ContactCard — it's not a navigation card, it's an info card.

**Step 2: Run tests**

Run: `npx vitest run src/components/organigram/`
Expected: All pass

**Step 3: Commit**

```
refactor(ui): standardize ContactCard radius and shadow to card tokens (#1031)
```

---

### Task 9: Standardize SearchResult + ResponsibilityBlock quick links

**Files:**

- Modify: `src/components/search/SearchResult.tsx`
- Modify: `src/components/responsibility/ResponsibilityBlock.tsx`

**Step 1: Update SearchResult (line ~39)**

- `rounded-lg` → `rounded-card`
- `"shadow-sm hover:shadow-md transition-shadow"` → `"shadow-sm hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"`

Add green accent bar inside the Link.

**Step 2: Update ResponsibilityBlock quick links (lines ~63, ~82, ~99)**

- `rounded-lg` → `rounded-card`
- `"shadow-sm hover:shadow-md transition-shadow"` → `"shadow-sm hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"`

Add green accent bar inside each Link.

**Step 3: Run tests**

Run: `npx vitest run src/components/search/ src/components/responsibility/`
Expected: All pass

**Step 4: Commit**

```
refactor(ui): standardize SearchResult + ResponsibilityBlock cards (#1031)
```

---

### Task 10: Standardize RelatedContentCard

**Files:**

- Modify: `src/components/related/RelatedContentCard/RelatedContentCard.tsx`

Currently: `rounded-lg`, border highlight on hover, no shadow/lift.

**Step 1: Update RelatedContentCard (lines ~137-139)**

- `rounded-lg` → `rounded-card`
- Add `hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300` when it has `href`

Add green accent bar.

**Step 2: Run tests**

Run: `npx vitest run src/components/related/`
Expected: All pass

**Step 3: Commit**

```
refactor(ui): standardize RelatedContentCard to card tokens (#1031)
```

---

### Task 11: Light-touch updates for MatchTeaser + MatchResultRow

**Files:**

- Modify: `src/components/match/MatchTeaser/MatchTeaser.tsx`
- Modify: `src/components/match/MatchResultRow/MatchResultRow.tsx`

These are compact row items, not full cards. Only standardize radius.

**Step 1: MatchTeaser**

- `rounded` → `rounded-card` (line ~144)

**Step 2: MatchResultRow**

- `rounded-lg` → `rounded-card` (line ~102)

**Step 3: Run tests**

Run: `npx vitest run src/components/match/`
Expected: All pass

**Step 4: Commit**

```
refactor(ui): standardize match row radius to card token (#1031)
```

---

### Task 12: Create Foundation/Card Interactions Storybook MDX page

**Files:**

- Create: `src/stories/foundation/CardInteractions.mdx`

This page shows every card component side-by-side so designers/devs can verify consistent hover feel.

**Step 1: Create the MDX file**

Create `src/stories/foundation/CardInteractions.mdx` with:

- Meta title `Foundation/Card Interactions`
- Token reference table (radius, shadow, lift, timing, accent)
- Live examples of each card type (NewsCard, EditorialCard, PlayerCard, TeamCard, EventCard, SearchResult) with mock data
- "Exceptions" section documenting MatchTeaser/MatchResultRow (row items, subtle hover only)

**Step 2: Verify it appears in Storybook sidebar**

Run dev server or build and check `Foundation/Card Interactions` shows up.

**Step 3: Commit**

```
docs(ui): add Foundation/Card Interactions Storybook page (#1031)
```

---

### Task 13: Final verification

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All 1723+ tests pass

**Step 2: Run lint + type-check**

Run: `pnpm --filter @kcvv/web lint:fix && pnpm turbo type-check`
Expected: Clean

**Step 3: Grep for remaining inconsistencies**

```bash
# No more arbitrary shadows on cards
rg "hover:shadow-\[" src/components/ --glob="*Card*" --glob="*.tsx"
rg "hover:shadow-xl" src/components/ --glob="*.tsx"

# No more rounded-lg/rounded-xl/rounded-sm on cards (except non-card elements)
rg "rounded-lg|rounded-xl" src/components/ --glob="*Card*" --glob="*.tsx"
```

Expected: No card-related matches

**Step 4: Push**

```bash
git push
```
