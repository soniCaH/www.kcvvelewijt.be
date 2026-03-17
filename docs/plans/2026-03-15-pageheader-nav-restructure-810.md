# PageHeader Nav Restructure (#810) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure PageHeader to `h-16`, resize logo to `h-10`, add a desktop utility group (search icon + "Word lid" CTA), and recolor the active nav underline from white to green.

**Architecture:** Three files change — `Navigation.tsx` (remove search item, recolor active underline CSS), `PageHeader.tsx` (height, logo, utility group, spacer), and their test/story files. No new components needed.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, Vitest + Testing Library, Storybook 10

---

### Task 1: Update Navigation — active underline color + remove search item

**Files:**

- Modify: `apps/web/src/components/layout/Navigation/Navigation.test.tsx`
- Modify: `apps/web/src/components/layout/Navigation/Navigation.tsx`

**Step 1: Update the test — remove the search link assertion from Navigation**

The search icon is moving to the PageHeader utility group. The Navigation component will no longer render it.

In `Navigation.test.tsx`, remove this entire test block (lines 57–60):

```typescript
it("should render search link", () => {
  render(<Navigation seniorTeams={seniorTeams} />);
  expect(screen.getByLabelText("Search")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it currently passes (before the component change)**

```bash
pnpm --filter @kcvv/web test -- --run Navigation
```

Expected: all tests PASS (including the search link test — confirming it's a valid test to delete)

**Step 3: Remove the search `<li>` from Navigation.tsx**

In `Navigation.tsx`, delete lines 266–276 (the entire Search Link `<li>` block):

```tsx
{
  /* Search Link */
}
<li className="inline-block">
  <Link
    href="/search"
    className="nav-link text-[0.7rem] xl:text-[0.875rem] uppercase font-bold text-white whitespace-nowrap no-underline py-2 px-2 transition-all duration-300 inline-block"
    aria-label="Search"
  >
    <Search size={16} className="inline-block align-middle" />
    <span className="sr-only">Search</span>
  </Link>
</li>;
```

Also remove the `Search` import from line 13:

```typescript
import { Search } from "@/lib/icons";
```

**Step 4: Change active underline color from white to green**

In `Navigation.tsx`, inside the `dangerouslySetInnerHTML` CSS block, change the `background` color for `::after`:

```css
/* Before */
background: #fff;

/* After */
background: #4acf52;
```

The line is at approximately line 180. Only change `#fff` on the `::after` pseudo-element — the dropdown chevron SVG `fill='%23fff'` (line ~194) stays white.

**Step 5: Run tests to verify they all pass**

```bash
pnpm --filter @kcvv/web test -- --run Navigation
```

Expected: all tests PASS, search link test is gone

**Step 6: Commit**

```bash
git add apps/web/src/components/layout/Navigation/Navigation.tsx apps/web/src/components/layout/Navigation/Navigation.test.tsx
git commit -m "feat(ui): remove search from nav list, recolor active underline green (#810)"
```

---

### Task 2: Update PageHeader — height, logo, spacer, utility group

**Files:**

- Modify: `apps/web/src/components/layout/PageHeader/PageHeader.test.tsx`
- Modify: `apps/web/src/components/layout/PageHeader/PageHeader.tsx`

**Step 1: Write failing tests for the new structure**

In `PageHeader.test.tsx`, update the existing `"should have fixed navigation"` test and add new ones:

Replace the current height assertion (finds `h-20`):

```typescript
it("should have fixed navigation", () => {
  const { container } = render(<PageHeader />);
  const nav = container.querySelector("nav");
  expect(nav).toHaveClass("fixed");
  expect(nav).toHaveClass("top-[3px]");
  expect(nav).toHaveClass("h-16");
});
```

Add these two tests inside `describe("Desktop View", ...)`:

```typescript
it("should render 'Word lid' link pointing to /club/register", () => {
  const { container } = render(<PageHeader />);
  const wordLidLink = container.querySelector('a[href="/club/register"]');
  expect(wordLidLink).toBeInTheDocument();
  expect(wordLidLink).toHaveTextContent(/word lid/i);
});

it("should render desktop search link in utility group", () => {
  const { container } = render(<PageHeader />);
  // Desktop utility group search link - there are multiple search links (mobile + desktop)
  const searchLinks = container.querySelectorAll('a[href="/search"]');
  expect(searchLinks.length).toBeGreaterThanOrEqual(2);
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @kcvv/web test -- --run PageHeader
```

Expected:

- `should have fixed navigation` FAILS — `h-16` class not found (currently `h-20`)
- `should render 'Word lid' link` FAILS — element not found
- `should render desktop search link in utility group` FAILS — only 1 search link found

**Step 3: Update PageHeader.tsx — height and spacer**

In `PageHeader.tsx`, change the `<nav>` className:

```tsx
/* Before */
<nav className="fixed top-[3px] left-0 right-0 z-50 h-20 lg:h-[7.5rem] transition-[height] duration-300 bg-kcvv-black border-b border-white/[0.06]">

/* After */
<nav className="fixed top-[3px] left-0 right-0 z-50 h-16 transition-[height] duration-300 bg-kcvv-black border-b border-white/[0.06]">
```

Update the spacer `<div>`:

```tsx
/* Before */
<div
  className="h-[calc(5rem+3px)] lg:h-[calc(7.5rem+3px)]"
  aria-hidden="true"
/>

/* After */
<div
  className="h-[calc(4rem+3px)]"
  aria-hidden="true"
/>
```

**Step 4: Update PageHeader.tsx — mobile header element positions**

The mobile header is now `h-16` (64px). Recalculate vertical centering for 16px icons and 40px logo:

```tsx
/* Hamburger button — before */
className = "absolute left-[34px] top-[calc((5rem-16px)/2)] ...";

/* Hamburger button — after */
className = "absolute left-[34px] top-6 ...";
```

```tsx
/* Mobile Logo — before */
className = "absolute left-1/2 -translate-x-1/2 top-[calc((5rem-100px)/2)]";

/* Mobile Logo — after */
className = "absolute left-1/2 -translate-x-1/2 top-3";
```

```tsx
/* Search button — before */
className = "absolute right-[34px] top-[calc((5rem-16px)/2)] ...";

/* Search button — after */
className = "absolute right-[34px] top-6 ...";
```

**Step 5: Update PageHeader.tsx — mobile logo size**

Change the mobile `<Image>` component:

```tsx
/* Before */
<Image
  src="/images/logos/kcvv-logo.png"
  alt="KCVV ELEWIJT"
  width={100}
  height={100}
  priority
  className="w-[100px] h-auto"
/>

/* After */
<Image
  src="/images/logos/kcvv-logo.png"
  alt="KCVV ELEWIJT"
  width={40}
  height={40}
  priority
  className="h-10 w-auto"
/>
```

**Step 6: Update PageHeader.tsx — desktop logo size**

Change the desktop `<Image>` component:

```tsx
/* Before */
<Image
  src="/images/logos/kcvv-logo.png"
  alt="KCVV ELEWIJT"
  width={112}
  height={112}
  priority
  className="h-28 w-auto transition-all duration-300"
/>

/* After */
<Image
  src="/images/logos/kcvv-logo.png"
  alt="KCVV ELEWIJT"
  width={40}
  height={40}
  priority
  className="h-10 w-auto"
/>
```

**Step 7: Update PageHeader.tsx — add utility group to desktop layout**

The desktop `<div>` currently ends with `<Navigation ... />`. Add a utility group after it, inside the same flex container:

```tsx
{
  /* Desktop Navigation - Suspense boundary for useSearchParams */
}
<Suspense fallback={<div className="grow" />}>
  <Navigation youthTeams={youthTeams} seniorTeams={seniorTeams} />
</Suspense>;

{
  /* Desktop Utility Group */
}
<div className="flex items-center gap-3 shrink-0">
  <Link
    href="/search"
    aria-label="Search"
    className="text-white/70 hover:text-white transition-colors"
  >
    <Search size={16} />
  </Link>
  <Link
    href="/club/register"
    className="border border-kcvv-green/60 text-white text-sm font-semibold px-4 py-1.5 rounded-sm hover:border-kcvv-green hover:text-kcvv-green transition-colors whitespace-nowrap"
  >
    Word lid
  </Link>
</div>;
```

Make sure `Search` is still imported at the top — it was removed from `Navigation.tsx` but it's already imported in `PageHeader.tsx` on line 13:

```typescript
import { Search, Menu } from "@/lib/icons";
```

No import change needed in PageHeader.

**Step 8: Run tests to verify they all pass**

```bash
pnpm --filter @kcvv/web test -- --run PageHeader
```

Expected: all tests PASS including the 3 new/updated ones

**Step 9: Commit**

```bash
git add apps/web/src/components/layout/PageHeader/PageHeader.tsx apps/web/src/components/layout/PageHeader/PageHeader.test.tsx
git commit -m "feat(ui): restructure PageHeader — h-16, logo h-10, desktop utility group (#810)"
```

---

### Task 3: Update PageHeader stories

**Files:**

- Modify: `apps/web/src/components/layout/PageHeader/PageHeader.stories.tsx`

**Step 1: Update content spacer padding in all three stories**

The fixed nav is now `h-16` (4rem) + 3px AccentStrip. Update `pt-` values in story content wrappers:

In `Default` story (line 52):

```tsx
/* Before */
<div className="p-8 pt-[calc(7.5rem+3px)]">

/* After */
<div className="p-8 pt-[calc(4rem+3px)]">
```

In `MobileView` story (line 79):

```tsx
/* Before */
<div className="p-4 pt-[calc(5rem+3px)]">

/* After */
<div className="p-4 pt-[calc(4rem+3px)]">
```

In `WithContent` story (line 103):

```tsx
/* Before */
<main className="flex-1 pt-[calc(7.5rem+3px)]">

/* After */
<main className="flex-1 pt-[calc(4rem+3px)]">
```

**Step 2: Commit**

```bash
git add apps/web/src/components/layout/PageHeader/PageHeader.stories.tsx
git commit -m "feat(ui): update PageHeader stories for h-16 spacer (#810)"
```

---

### Task 4: Full test run + lint + GitHub update

**Step 1: Run full test suite**

```bash
pnpm --filter @kcvv/web test -- --run
```

Expected: all tests pass (1572+)

**Step 2: Run lint**

```bash
pnpm --filter @kcvv/web lint:fix
```

Expected: no errors

**Step 3: Type check**

```bash
pnpm --filter @kcvv/web type-check
```

Expected: no errors

**Step 4: Comment on GitHub issue #810**

```bash
gh issue comment 810 --body "Implementation complete on \`feat/redesign-design-tokens-809\`:

- Navigation: search icon removed from nav list, active underline recolored green (#4acf52)
- PageHeader: height → h-16 (64px), logo → h-10, desktop utility group (search + Word lid → /club/register)
- Mobile: same h-16, logo resized, button positions recalculated
- Stories and tests updated

Ready for review."
```

**Step 5: Push**

```bash
git push
```
