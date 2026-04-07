# Page Redesigns Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the approved KCVV design language to seven production pages and refactor the PlayerCard component to use the new diagonal-cut design — replacing one-off layouts and inconsistent components with the standard `SectionStack` + `PageHero` + diagonal-transition pattern.

**Architecture:** Each redesigned page becomes a `SectionStack` composition (the same pattern already used by `/club`, `/jeugd`, `/sponsors`). PlayerCard is rewritten as a single component that uses CSS `clip-path` for the bottom diagonal cut and animates a green top accent on hover from the center outward. The Hulp page replaces the `ResponsibilityFinder` (role dropdown + inline-sentence input) with a search + categorized browse layout and a new answer view that shows ONE prominent contact card. All design decisions are documented in `docs/plans/2026-04-06-team-board-page-redesign-design.md` and the visual prototypes live in Storybook under `Pages/<Name> Redesign`.

**Tech Stack:**

- Next.js 15 App Router
- React 19, TypeScript strict
- Tailwind CSS v4 (`@theme` in `globals.css`)
- Vitest + `@testing-library/react`
- Effect (server-side data fetching)
- Sanity CMS (responsibility paths, club content)
- Storybook 10 (`@storybook/nextjs-vite`)

**Reference visual prototypes (already merged in `worktree-team-detail-redesign-stories`):**

- `Pages/PlayerCard Redesign` → `apps/web/src/components/player/PlayerCardRedesign/PlayerCardRedesign.stories.tsx`
- `Pages/TeamDetail Redesign` → `apps/web/src/components/team/TeamDetailRedesign/TeamDetailRedesign.stories.tsx`
- `Pages/Board Page Redesign` → `apps/web/src/components/club/BoardPageRedesign/BoardPageRedesign.stories.tsx`
- `Pages/Hulp Redesign` → `apps/web/src/components/hulp/HulpPageRedesign/HulpPageRedesign.stories.tsx`
- `Pages/Privacy Redesign` → `apps/web/src/components/privacy/PrivacyPageRedesign/PrivacyPageRedesign.stories.tsx`
- `Pages/Club Geschiedenis Redesign` → `apps/web/src/components/club/ClubGeschiedenisRedesign/ClubGeschiedenisRedesign.stories.tsx`
- `Pages/Club Organigram Redesign` → `apps/web/src/components/club/ClubOrganigramRedesign/ClubOrganigramRedesign.stories.tsx`

**Order of work:**

1. **Phase 1 — PlayerCard refactor** (foundation; affects all team pages)
2. **Phase 2 — Quick wins** (Privacy → Geschiedenis → Organigram; lowest risk)
3. **Phase 3 — Team Detail page** (depends on Phase 1)
4. **Phase 4 — Board pages** (low risk; reuses TeamRoster)
5. **Phase 5 — Hulp page** (largest scope; new UX)

Each phase ends with a commit and an opportunity to merge before continuing. Phases are independent except where noted.

---

## Phase 1 — PlayerCard refactor

The current `PlayerCard` (`apps/web/src/components/player/PlayerCard/PlayerCard.tsx`) expects transparent player cutouts and uses a hover slide-left animation that looks broken with non-transparent photos. The new design uses CSS `clip-path` to create a diagonal cut at the bottom of the photo, with a stencil number sitting on the seam.

The reference implementation lives in `PlayerCardRedesign.stories.tsx` (`PersonCardDiagonal` function). Read that file in full before starting.

### Task 1.1: Add tests for the new PlayerCard structure

**Files:**

- Modify: `apps/web/src/components/player/PlayerCard/PlayerCard.test.tsx`

**Step 1: Read the existing test file**

Run: `cat apps/web/src/components/player/PlayerCard/PlayerCard.test.tsx`

Note which tests assert the OLD behaviour (slide-left hover, NumberBadge component, isCaptain badge). Most can be deleted.

**Step 2: Replace the test file with assertions for the new structure**

The new card should be testable for:

- Renders an `<a>` linking to `href`
- Renders the player's first and last name
- Renders the position
- Renders the badge number when provided (in a `<div>` with `font-stenciletta` family — match by content)
- Has a clip-path style on the photo wrapper (style attribute contains `clipPath`)
- Has a `relative shrink-0` photo wrapper for equal-height grid layout
- The card root is a flex column with `h-full` so it stretches in a CSS Grid cell
- Hover accent bar exists (a 3px element with `bg-kcvv-green-bright`, initial `scale-x-0`)
- Loading skeleton renders when `isLoading` is true
- No captain badge — `isCaptain` prop is ignored or not in props at all

Write 8-10 focused tests. Use `screen.getByRole("link")`, `screen.getByText`, `container.querySelector` for class-based assertions.

**Step 3: Run the new tests and verify they fail**

Run: `pnpm --filter @kcvv/web test src/components/player/PlayerCard/PlayerCard.test.tsx 2>&1 | tail -30`

Expected: Several failures because the OLD component still has NumberBadge, captain badge, slide-left hover.

**Step 4: Commit the failing tests**

```bash
git add apps/web/src/components/player/PlayerCard/PlayerCard.test.tsx
git commit -m "test(players): rewrite PlayerCard tests for diagonal-cut redesign"
```

### Task 1.2: Rewrite PlayerCard component

**Files:**

- Modify: `apps/web/src/components/player/PlayerCard/PlayerCard.tsx`

**Step 1: Copy the implementation from the prototype**

Open the reference: `apps/web/src/components/player/PlayerCardRedesign/PlayerCardRedesign.stories.tsx` and locate the `PersonCardDiagonal` function. Read the full implementation including `badgeColors` helper.

**Step 2: Rewrite PlayerCard.tsx**

Replace the entire component with one that:

- Removes `forwardRef`, `HTMLAttributes`, `NumberBadge`, `CARD_COLORS`, `cn` imports if no longer needed
- Removes the `variant: "default" | "compact"` prop entirely (the new design has one size)
- Removes the `isCaptain` prop
- Keeps `firstName`, `lastName`, `position`, `href`, `number`, `imageUrl`, `isLoading`
- Uses `flex h-full flex-col` on the `<a>` root
- Uses `style={{ aspectRatio: "4 / 5" }}` and `shrink-0` on the photo wrapper
- Uses CSS `clip-path: polygon(0 0, 100% 0, 100% 86%, 0 100%)` on an inner div containing the `<Image>`
- Uses Stenciletta font for the number with `WebkitTextStroke: "2px white"`
- Uses `flex-1` on the name section so cards in a row are equal height
- Has the green hover accent bar at top: `origin-center scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100`
- Loading skeleton renders an empty card with `animate-pulse` placeholders matching the new layout

Use the prototype as the canonical source. Convert from `PersonData` typed props to `PlayerCardProps` typed props.

**Step 3: Run the tests**

Run: `pnpm --filter @kcvv/web test src/components/player/PlayerCard/PlayerCard.test.tsx 2>&1 | tail -20`

Expected: All tests pass.

**Step 4: Run lint**

Run: `pnpm --filter @kcvv/web lint 2>&1 | tail -10`

Expected: No errors. Fix any unused-import warnings (likely `NumberBadge`, `CARD_COLORS`, `cn`, `forwardRef`).

**Step 5: Commit**

```bash
git add apps/web/src/components/player/PlayerCard/PlayerCard.tsx
git commit -m "feat(players): refactor PlayerCard to diagonal-cut design"
```

### Task 1.3: Update PlayerCard.stories.tsx

**Files:**

- Modify: `apps/web/src/components/player/PlayerCard/PlayerCard.stories.tsx`

**Step 1: Read the existing story file**

Run: `cat apps/web/src/components/player/PlayerCard/PlayerCard.stories.tsx`

Note which stories use the removed props (`variant`, `isCaptain`).

**Step 2: Update stories**

- Remove any story that uses `variant="compact"` (no longer exists)
- Remove any story that uses `isCaptain={true}` (no longer exists)
- Update the `Default` story to render the new layout
- Add a `Loading` story showing the new skeleton if not present
- Add a `WithoutPhoto` story to show the placeholder behaviour

**Step 3: Run type-check**

Run: `pnpm --filter @kcvv/web type-check 2>&1 | tail -10`

Expected: No errors related to `PlayerCard.stories.tsx`.

**Step 4: Verify in Storybook**

Run: `pnpm --filter @kcvv/web storybook` and visit `Features/Players/PlayerCard`. Confirm Default renders the new layout.

**Step 5: Commit**

```bash
git add apps/web/src/components/player/PlayerCard/PlayerCard.stories.tsx
git commit -m "docs(players): update PlayerCard stories for diagonal redesign"
```

### Task 1.4: Update TeamRoster to consume the new PlayerCard

**Files:**

- Modify: `apps/web/src/components/team/TeamRoster/TeamRoster.tsx`
- Modify: `apps/web/src/components/team/TeamRoster/TeamRoster.test.tsx`

**Step 1: Find usages of removed props**

Run: `grep -n "variant\|isCaptain" apps/web/src/components/team/TeamRoster/TeamRoster.tsx`

**Step 2: Update TeamRoster**

- Remove the `variant` prop on TeamRoster if it exists
- Remove `isCaptain` from the `RosterPlayer` interface
- Remove any code that passes `variant` or `isCaptain` to `<PlayerCard>`
- The grid layout stays: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`

**Step 3: Update TeamRoster tests**

Remove tests that:

- Assert the captain badge is rendered
- Assert the compact variant grid has more columns
- Pass `isCaptain` or `variant` to mock players

**Step 4: Update the StaffMember rendering inside TeamRoster**

The staff cards in TeamRoster should also use the new diagonal layout (matching `DiagonalStaffCard` in the prototype). Either:

- (a) extract `DiagonalStaffCard` from the prototype into a real component at `apps/web/src/components/team/StaffCard/StaffCard.tsx`, or
- (b) inline a similar variant directly in TeamRoster.tsx

Recommend (a) — it's reusable.

**Step 5: Run all tests touching PlayerCard / TeamRoster**

Run: `pnpm --filter @kcvv/web test src/components/team/TeamRoster src/components/player 2>&1 | tail -20`

Expected: All pass.

**Step 6: Commit**

```bash
git add apps/web/src/components/team/TeamRoster/TeamRoster.tsx apps/web/src/components/team/TeamRoster/TeamRoster.test.tsx apps/web/src/components/team/StaffCard/
git commit -m "feat(teams): adopt diagonal PlayerCard in TeamRoster, drop isCaptain/variant"
```

### Task 1.5: Search for and remove all other consumers of removed PlayerCard props

**Step 1: Grep the codebase**

```bash
grep -rn "isCaptain\|variant=\"compact\"\|PlayerCard.*compact" apps/web/src --include="*.tsx" --include="*.ts"
```

**Step 2: For each match, remove the prop**

Most likely places:

- `apps/web/src/components/team/TeamFeaturedCard/`
- `apps/web/src/components/team/TeamOverview/`
- Any `*.stories.tsx` referencing PlayerCard

**Step 3: Run full type-check**

Run: `pnpm --filter @kcvv/web type-check 2>&1 | grep error | head -20`

Expected: No errors.

**Step 4: Run full test suite**

Run: `pnpm --filter @kcvv/web test 2>&1 | tail -10`

Expected: All tests pass (or only tests for the to-be-removed `isCaptain` feature fail — fix those).

**Step 5: Commit**

```bash
git add -u apps/web/src/components
git commit -m "refactor(players): remove all PlayerCard isCaptain/variant call sites"
```

### Task 1.6: Delete the PlayerCardRedesign prototype

The prototype's job is done — PlayerCard now matches it.

**Step 1: Delete the directory**

```bash
rm -rf apps/web/src/components/player/PlayerCardRedesign
```

**Step 2: Confirm Storybook still builds**

Run: `pnpm --filter @kcvv/web type-check 2>&1 | grep error | head`

Expected: No errors.

**Step 3: Commit**

```bash
git add -u apps/web/src/components/player
git commit -m "chore(players): remove PlayerCardRedesign prototype now that PlayerCard is updated"
```

---

## Phase 2 — Quick wins (Privacy → Geschiedenis → Organigram)

These three pages are simple wrappers — replace the existing layout with `SectionStack` + `PageHero` + diagonal transitions. Lowest risk first.

### Task 2.1: Privacy page

**Files:**

- Modify: `apps/web/src/app/(main)/privacy/page.tsx`
- Modify: `apps/web/src/app/(main)/privacy/page.test.tsx` (create if missing)

**Step 1: Read the prototype**

Run: `cat apps/web/src/components/privacy/PrivacyPageRedesign/PrivacyPageRedesign.stories.tsx`

Note the structure: `PageHero` (compact, dark) → `gray-100` section with prose content → no CTA → footer.

**Step 2: Read the current production page**

Run: `cat 'apps/web/src/app/(main)/privacy/page.tsx'`

Note the actual legal content (it's NOT Lorem Ipsum — preserve every word and section heading).

**Step 3: Write a test for the new structure**

Create or update `apps/web/src/app/(main)/privacy/page.test.tsx` to assert:

- The page renders a `PageHero` with label "Juridisch", headline "Privacyverklaring"
- The page renders a section with `bg-gray-100`
- The page renders the prose container `prose prose-gray max-w-2xl mx-auto`
- All actual section headings from the original content are present (e.g. "Inleiding", "Welke gegevens", "Hoe wij ze gebruiken", "Jouw rechten", "Contact")

**Step 4: Run the test, verify it fails**

Run: `pnpm --filter @kcvv/web test src/app/\(main\)/privacy 2>&1 | tail -20`

Expected: Fails because the current page doesn't use `PageHero` or `SectionStack`.

**Step 5: Update privacy/page.tsx**

Use the prototype as the template, but replace the placeholder Lorem Ipsum with the actual legal content from the original page. Wrap the prose in `SectionStack` with the `heroSection` and `contentSection` configs. Do not add a CTA — the footer transition handles the visual close.

**Step 6: Run the test, verify it passes**

Run: `pnpm --filter @kcvv/web test src/app/\(main\)/privacy 2>&1 | tail -20`

Expected: All tests pass.

**Step 7: Delete the privacy prototype**

```bash
rm -rf apps/web/src/components/privacy/PrivacyPageRedesign
```

**Step 8: Commit**

```bash
git add 'apps/web/src/app/(main)/privacy' apps/web/src/components/privacy
git commit -m "feat(ui): redesign /privacy page with PageHero + prose section"
```

### Task 2.2: Club Geschiedenis page

**Files:**

- Modify: `apps/web/src/app/(main)/club/geschiedenis/HistoryContent.tsx`

**Step 1: Read the prototype**

Run: `cat apps/web/src/components/club/ClubGeschiedenisRedesign/ClubGeschiedenisRedesign.stories.tsx`

The prototype has a restyled `TimelineSection` / `TimelineRow` / `TimelineCard` / `TimelineImage` set, organized in `chapters` with images interspersed. The Tailwind class `hidden md:block md:invisible` (correct order!) keeps the alternating layout working.

**Step 2: Read current HistoryContent.tsx**

Run: `cat 'apps/web/src/app/(main)/club/geschiedenis/HistoryContent.tsx'`

Note the FULL real content (10+ TimelineItem blocks with extensive Dutch text + 8 TimelineImage blocks). Preserve every word.

**Step 3: Update HistoryContent to wrap in SectionStack**

The minimal change:

- Keep the existing `TimelineSection`, `TimelineItem`, `TimelineImage` helpers
- BUT change `<TimelineItem>`'s `hidden md:block md:invisible` to use this exact class order (not `md:invisible md:hidden` which breaks alternating layout)
- Restyle the `TimelineItem` card from `bg-white rounded-lg shadow-md p-6` to `rounded-sm border-l-4 border-kcvv-green-bright bg-white p-6 shadow-sm`
- Restyle the date label from `text-kcvv-green-bright font-bold text-lg mb-2` to `mb-2 text-xs font-bold uppercase tracking-[0.15em] text-kcvv-green-dark`
- Restyle the timeline center line from `bg-kcvv-green-bright` to `bg-kcvv-green-bright/40`
- Restyle the timeline dot from a 12×12 circle in a 48×48 outer to a smaller 16×16 dot with `shadow-[0_0_0_4px_rgba(243,244,246,1)]` ring
- Wrap the entire return in `<SectionStack>` with: `heroSection` (the existing `<PageHero>`), `timelineSection` (`bg: "gray-100"`, contains the `<div className="max-w-5xl mx-auto px-4 py-12">…timeline…</div>`), and a closing `ctaSection` on `bg: "kcvv-black"` with `<SectionCta variant="dark" heading="Maak deel uit van ons verhaal" body="Kom langs op een wedstrijd of word lid van de plezantste compagnie." buttonLabel="Word lid" buttonHref="/hulp" />`
- Drop the `useScrollReveal` hook if it's now incompatible — or keep it if it still works (test both)

**Step 4: Update or create a test**

`apps/web/src/app/(main)/club/geschiedenis/HistoryContent.test.tsx` exists. Update it to assert:

- A `PageHero` is rendered
- The container uses `max-w-5xl`
- The first `TimelineItem` date "1909 - 1935" is in the document
- A `SectionCta` is rendered

**Step 5: Run the test**

Run: `pnpm --filter @kcvv/web test geschiedenis 2>&1 | tail -20`

Expected: All tests pass.

**Step 6: Delete the geschiedenis prototype**

```bash
rm -rf apps/web/src/components/club/ClubGeschiedenisRedesign
```

**Step 7: Commit**

```bash
git add 'apps/web/src/app/(main)/club/geschiedenis' apps/web/src/components/club/ClubGeschiedenisRedesign
git commit -m "feat(ui): wrap /club/geschiedenis in SectionStack, restyle timeline tokens"
```

### Task 2.3: Club Organigram page

**Files:**

- Modify: `apps/web/src/app/(main)/club/organigram/page.tsx`

**Step 1: Read the prototype**

Run: `cat apps/web/src/components/club/ClubOrganigramRedesign/ClubOrganigramRedesign.stories.tsx`

The prototype wraps `UnifiedOrganigramClient` in `SectionStack` with: hero → chart section → CTA. The chart section uses `max-w-7xl mx-auto px-4 md:px-8` (matching production) without an `overflow-x-auto` wrapper.

**Step 2: Read the current production page**

Run: `cat 'apps/web/src/app/(main)/club/organigram/page.tsx'`

Note the data fetching (Effect.gen with StaffRepository + ResponsibilityRepository), JsonLd, Suspense fallback. Preserve all of that.

**Step 3: Update the page to use SectionStack**

Replace the `<div className="min-h-screen bg-gray-50"><PageHero …/><div className="max-w-7xl mx-auto px-4 py-8">…</div></div>` structure with:

```typescript
<>
  <JsonLd data={…} />
  <SectionStack
    sections={[
      {
        key: "hero",
        bg: "kcvv-black",
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        content: <PageHero size="compact" gradient="dark" label="De club" headline="Clubstructuur" body="Ontdek de organisatie achter KCVV Elewijt." />,
        transition: { type: "diagonal", direction: "right", overlap: "full" },
      },
      {
        key: "chart",
        bg: "gray-100",
        content: (
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Suspense fallback={…}>
              <UnifiedOrganigramClient members={members} responsibilityPaths={responsibilityPaths} />
            </Suspense>
          </div>
        ),
        transition: { type: "diagonal", direction: "left" },
      },
      {
        key: "cta",
        bg: "kcvv-green-dark",
        paddingTop: "pt-16",
        paddingBottom: "pb-16",
        content: <SectionCta variant="dark" heading="Wie zoek je?" body="Vind de juiste contactpersoon voor jouw vraag." buttonLabel="Naar de helppagina" buttonHref="/hulp" />,
      },
    ]}
  />
</>
```

**Step 4: Update the page test if it exists**

Run: `find apps/web/src/app/\(main\)/club/organigram -name "*.test.tsx"`

If a test exists, update it to assert the SectionStack structure.

**Step 5: Run tests**

Run: `pnpm --filter @kcvv/web test organigram 2>&1 | tail -20`

Expected: All pass.

**Step 6: Delete the organigram prototype**

```bash
rm -rf apps/web/src/components/club/ClubOrganigramRedesign
```

**Step 7: Commit**

```bash
git add 'apps/web/src/app/(main)/club/organigram' apps/web/src/components/club/ClubOrganigramRedesign
git commit -m "feat(ui): wrap /club/organigram in SectionStack with diagonal transitions"
```

---

## Phase 3 — Team Detail page

The biggest single page change. The current page uses `TeamHeader` (overlapping white card on banner) + a generic Radix tab system. The new design uses `PageHero` (with team image) + a branded tab bar + the new diagonal `TeamRoster`.

**Depends on:** Phase 1 (PlayerCard refactor must be complete).

### Task 3.1: Read all the moving pieces

**Step 1: Read the prototype**

Run: `cat apps/web/src/components/team/TeamDetailRedesign/TeamDetailRedesign.stories.tsx`

This is the canonical reference for the new layout.

**Step 2: Read the current production page and components**

```bash
cat 'apps/web/src/app/(main)/ploegen/[slug]/page.tsx'
cat apps/web/src/components/team/TeamDetail/TeamDetail.tsx
cat apps/web/src/components/team/TeamHeader/TeamHeader.tsx
```

Note: data fetching, JsonLd, the tab structure, where the "Info / Spelers / Wedstrijden / Klassement" tabs come from.

### Task 3.2: Build a new branded TabBar component

The Approach 3 prototype uses an inline tab bar. Let's extract it into a real `BrandedTabs` component at `apps/web/src/components/design-system/BrandedTabs/BrandedTabs.tsx` so it can be reused across all tabbed pages.

**Files:**

- Create: `apps/web/src/components/design-system/BrandedTabs/BrandedTabs.tsx`
- Create: `apps/web/src/components/design-system/BrandedTabs/BrandedTabs.test.tsx`
- Create: `apps/web/src/components/design-system/BrandedTabs/BrandedTabs.stories.tsx`
- Create: `apps/web/src/components/design-system/BrandedTabs/index.ts`
- Modify: `apps/web/src/components/design-system/index.ts` (add to barrel)

**Step 1: Write the test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandedTabs } from "./BrandedTabs";

const tabs = [
  { id: "info", label: "Info" },
  { id: "spelers", label: "Spelers" },
  { id: "wedstrijden", label: "Wedstrijden" },
];

describe("BrandedTabs", () => {
  it("renders all tab labels", () => {
    render(<BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />);
    tabs.forEach((tab) => {
      expect(screen.getByRole("button", { name: tab.label })).toBeInTheDocument();
    });
  });

  it("highlights the active tab with green bottom border", () => {
    render(<BrandedTabs tabs={tabs} activeTabId="spelers" onTabChange={() => {}} />);
    const active = screen.getByRole("button", { name: "Spelers" });
    expect(active.className).toMatch(/border-kcvv-green-bright/);
    expect(active.className).toMatch(/text-kcvv-green-dark/);
  });

  it("calls onTabChange when a tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<BrandedTabs tabs={tabs} activeTabId="info" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Wedstrijden" }));
    expect(onTabChange).toHaveBeenCalledWith("wedstrijden");
  });
});
```

**Step 2: Run the test, verify it fails**

Run: `pnpm --filter @kcvv/web test BrandedTabs 2>&1 | tail -15`

Expected: Fails — component doesn't exist.

**Step 3: Implement BrandedTabs**

```typescript
"use client";

interface BrandedTab {
  id: string;
  label: string;
}

export interface BrandedTabsProps {
  tabs: BrandedTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function BrandedTabs({ tabs, activeTabId, onTabChange, className = "" }: BrandedTabsProps) {
  return (
    <div className={`flex gap-8 border-b border-gray-200 ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={
              isActive
                ? "border-b-4 border-kcvv-green-bright px-1 py-4 text-sm font-bold uppercase tracking-[0.05em] text-kcvv-green-dark"
                : "border-b-4 border-transparent px-1 py-4 text-sm font-bold uppercase tracking-[0.05em] text-kcvv-gray hover:text-kcvv-black"
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
```

**Step 4: Run the test, verify it passes**

Run: `pnpm --filter @kcvv/web test BrandedTabs 2>&1 | tail -15`

Expected: All pass.

**Step 5: Add Storybook story**

Create `BrandedTabs.stories.tsx` with a `Default` story showing 4 tabs and an interactive playground using `useState` for the active tab.

**Step 6: Add to barrel exports**

Edit `apps/web/src/components/design-system/index.ts` and add:

```typescript
export { BrandedTabs } from "./BrandedTabs";
export type { BrandedTabsProps } from "./BrandedTabs";
```

**Step 7: Commit**

```bash
git add apps/web/src/components/design-system/BrandedTabs apps/web/src/components/design-system/index.ts
git commit -m "feat(ui): add BrandedTabs design system component"
```

### Task 3.3: Replace TeamDetail's tab system with BrandedTabs + new layout

**Files:**

- Modify: `apps/web/src/components/team/TeamDetail/TeamDetail.tsx`
- Modify: `apps/web/src/components/team/TeamDetail/TeamDetail.test.tsx`
- (Optional) Delete: `apps/web/src/components/team/TeamHeader/` if no longer used elsewhere

**Step 1: Update tests for the new structure**

In `TeamDetail.test.tsx`, replace assertions about `TeamHeader` and the Radix tabs with assertions about:

- A `PageHero` is rendered with the team name as headline and division as body
- A `BrandedTabs` is rendered with the available tabs
- The default active tab is "spelers" (or "info" if no players)
- The selected tab's content is rendered (e.g., for "spelers", the new diagonal `TeamRoster` is in the DOM)
- A `SectionCta` with `variant="dark"` is rendered at the bottom

**Step 2: Run tests, verify they fail**

Run: `pnpm --filter @kcvv/web test TeamDetail 2>&1 | tail -20`

Expected: Failures — old structure.

**Step 3: Rewrite TeamDetail.tsx**

Use the prototype's section structure as the canonical layout. Wrap in `SectionStack`. Replace `TeamHeader` with `PageHero`. Use `BrandedTabs` for the tab bar. Use the new `TeamRoster` (already updated in Phase 1) for the Spelers panel. Use existing `TeamSchedule` and `TeamStandings` for the other panels — they don't need redesign work.

The only stateful interaction is which tab is active. Use the existing `useUrlTab` hook OR a new `useState` if simpler. URL syncing via `?tab=spelers` is recommended for shareable links.

**Step 4: Run tests, verify they pass**

Run: `pnpm --filter @kcvv/web test TeamDetail 2>&1 | tail -20`

**Step 5: Verify visually in Storybook**

Run Storybook and visit `Pages/TeamDetail Redesign` (the prototype). Then visit any team page in the dev server. Both should match.

**Step 6: Delete TeamHeader if unused**

```bash
grep -rn "TeamHeader" apps/web/src --include="*.tsx" --include="*.ts" | grep -v "TeamHeader/"
```

If only the redesign prototype references `TeamHeader`, delete it:

```bash
rm -rf apps/web/src/components/team/TeamHeader
```

**Step 7: Delete TeamDetailRedesign prototype**

```bash
rm -rf apps/web/src/components/team/TeamDetailRedesign
```

**Step 8: Commit**

```bash
git add apps/web/src/components/team/TeamDetail apps/web/src/components/team/TeamHeader apps/web/src/components/team/TeamDetailRedesign
git commit -m "feat(teams): redesign /ploegen/[slug] with PageHero + BrandedTabs + diagonal roster"
```

### Task 3.4: Verify all team pages render

**Step 1: Run the dev server**

```bash
pnpm --filter @kcvv/web dev
```

**Step 2: Visit several teams**

Open in browser:

- `/ploegen/kcvv-elewijt-a` (A team — has all sections)
- `/ploegen/<youth-team>` (sparse data — only roster, maybe matches)
- `/ploegen/<board-team-slug>` if board pages route through here

For each, verify:

- Hero shows the correct team image, name, division
- Tabs show only the panels with data
- Roster shows the diagonal player cards
- Standings (if present) shows W/D/L badges only for the KCVV row
- CTA at the bottom is dark green with white text

**Step 3: No commit needed (verification only)**

---

## Phase 4 — Board pages

Board pages currently route through `/club/bestuur`, `/club/jeugdbestuur`, `/club/angels`, etc. They use `BestuurPage` which renders `TeamHeader` + a roster. The new design uses `PageHero` + description (gray) + members on dark + organigram CTA on green.

**Depends on:** Phase 1 (so the staff cards inside the roster look right).

### Task 4.1: Update BestuurPage to use SectionStack

**Files:**

- Modify: `apps/web/src/components/club/BestuurPage/BestuurPage.tsx`
- Modify: `apps/web/src/components/club/BestuurPage/BestuurPage.test.tsx`

**Step 1: Read the prototype**

Run: `cat apps/web/src/components/club/BoardPageRedesign/BoardPageRedesign.stories.tsx`

The structure is: hero (compact, dark) → about (gray, with description and green left-border accent) → members on `kcvv-black` → CTA on `kcvv-green-dark`.

**Step 2: Read the current BestuurPage**

Run: `cat apps/web/src/components/club/BestuurPage/BestuurPage.tsx`

Note: it currently takes `header` (TeamHeaderProps), `description`, `staff`, `players`. The new version takes mostly the same props but uses different components.

**Step 3: Update tests**

Assert the new structure: PageHero, description block, SectionHeader with `variant="dark"`, TeamRoster on dark bg, OrganigramCta on green.

**Step 4: Update tests, verify failure**

Run: `pnpm --filter @kcvv/web test BestuurPage 2>&1 | tail -20`

**Step 5: Rewrite BestuurPage**

Use the prototype as the canonical structure. The page receives `name` (team name → headline), `description` (HTML), `staff[]` (members), and renders:

```typescript
<SectionStack
  sections={[
    { key: "hero", bg: "kcvv-black", paddingTop: "pt-0", paddingBottom: "pb-0", content: <PageHero size="compact" gradient="dark" label="De club" headline={name} body="De mensen achter KCVV Elewijt" />, transition: { type: "diagonal", direction: "right", overlap: "full" } },
    description && { key: "about", bg: "gray-100", content: <DescriptionBlock html={description} />, transition: { type: "diagonal", direction: "left" } },
    { key: "members", bg: "kcvv-black", content: <MembersSection staff={staff} />, transition: { type: "diagonal", direction: "right" } },
    { key: "cta", bg: "kcvv-green-dark", paddingTop: "pt-16", paddingBottom: "pb-16", content: <OrganigramCta /> },
  ]}
/>
```

`DescriptionBlock` uses `border-l-4 border-kcvv-green-bright pl-6 max-w-3xl` with `dangerouslySetInnerHTML` for the sanitized HTML.

`MembersSection` renders `<SectionHeader title="Ons bestuur" variant="dark" />` followed by `<TeamRoster players={[]} staff={staff} groupByPosition={false} showStaff staffSectionLabel={null} />`.

`OrganigramCta` renders `<SectionCta variant="dark" heading="Wie doet wat?" body="Bekijk het volledige organigram van KCVV Elewijt." buttonLabel="Organigram bekijken" buttonHref="/club/organigram" />`.

**Step 6: Run tests**

Run: `pnpm --filter @kcvv/web test BestuurPage 2>&1 | tail -20`

**Step 7: Delete the BoardPageRedesign prototype**

```bash
rm -rf apps/web/src/components/club/BoardPageRedesign
```

**Step 8: Commit**

```bash
git add apps/web/src/components/club/BestuurPage apps/web/src/components/club/BoardPageRedesign
git commit -m "feat(ui): redesign board pages with dark roster spotlight layout"
```

### Task 4.2: Verify all board pages render

**Step 1: Open the dev server**

```bash
pnpm --filter @kcvv/web dev
```

**Step 2: Visit each board page**

- `/club/bestuur`
- `/club/jeugdbestuur`
- `/club/angels`
- Any others created via `createBoardPage`

For each, verify the new layout: dark hero → gray description → dark members → green CTA. No verification commit needed.

---

## Phase 5 — Hulp page (largest scope)

Replace the entire `ResponsibilityFinder` UX (role dropdown + inline-sentence input) with a search + categorized browse layout. Add a new answer view that shows ONE prominent contact card and steps as plain text instructions.

**Depends on:** Nothing — fully independent.

This phase is the largest and is best executed as its own session. It involves:

- Building a new top-level `HulpPage` component (replaces `HelpPage`)
- Building several sub-components: `HulpSearchInput`, `CategorySection`, `QuestionCard`, `ContactCard`, `AnswerCard`, `BrowseContent`
- Wiring up the search behaviour against the existing semantic search hook
- Wiring up routing — selecting a question should update the URL (`?id=lidgeld-inschrijving`) so answers are shareable
- Adding analytics events for the new flow (search, suggestion click, answer view, contact click)
- Removing the old `ResponsibilityFinder.tsx` (1220 LOC) and friends after the new flow ships
- Updating the existing `ResponsibilityBlock` (used on the homepage) to use the new search-only mini-version

### Task 5.1: Read the prototype and identify reusable parts

**Step 1: Read the prototype**

Run: `cat apps/web/src/components/hulp/HulpPageRedesign/HulpPageRedesign.stories.tsx`

The prototype contains the full visual structure. Pay attention to: `SearchInput`, `QuestionCard`, `CategorySection`, `BrowseContent`, `ContactCard`, `AnswerCard`, `CATEGORY_META`, `CATEGORY_ORDER`.

**Step 2: Read the current Hulp page and ResponsibilityFinder**

```bash
cat 'apps/web/src/app/(main)/hulp/page.tsx'
cat apps/web/src/components/hulp/HelpPage/HelpPage.tsx
cat apps/web/src/components/responsibility/ResponsibilityFinder.tsx
```

Note all the analytics events (the `useResponsibilityAnalytics` hook), the data fetching, the routing/state management.

**Step 3: Read the existing analytics hook**

Run: `cat apps/web/src/hooks/useResponsibilityAnalytics.ts`

Note which events fire on which interactions. Plan which ones map to the new flow (search, suggestion click, contact click) and which ones become obsolete (role selected, inline sentence submitted).

### Task 5.2: Extract reusable subcomponents from the prototype

**Files:**

- Create: `apps/web/src/components/hulp/HulpPage/HulpPage.tsx`
- Create: `apps/web/src/components/hulp/HulpPage/HulpPage.test.tsx`
- Create: `apps/web/src/components/hulp/HulpPage/HulpPage.stories.tsx`
- Create: `apps/web/src/components/hulp/HulpPage/QuestionCard.tsx`
- Create: `apps/web/src/components/hulp/HulpPage/CategorySection.tsx`
- Create: `apps/web/src/components/hulp/HulpPage/BrowseContent.tsx`
- Create: `apps/web/src/components/hulp/HulpPage/AnswerCard.tsx`
- Create: `apps/web/src/components/hulp/HulpPage/ContactCard.tsx`
- Create: `apps/web/src/components/hulp/HulpPage/HulpSearchInput.tsx`
- Create: `apps/web/src/components/hulp/HulpPage/categoryMeta.ts`
- Create: `apps/web/src/components/hulp/HulpPage/index.ts`

For each subcomponent: write a focused unit test, then implement using the prototype's JSX as the canonical reference. Keep them small and pure (props in, JSX out, no internal state except where noted).

**Subcomponent breakdown:**

| Component         | Props                                                                                             | Notes                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `HulpSearchInput` | `value: string`, `onChange: (v: string) => void`, `placeholder?: string`                          | Controlled input with `<Search />` icon                                                      |
| `QuestionCard`    | `path: ResponsibilityPath`, `onClick: (id: string) => void`                                       | Clickable card with category icon, question, summary, chevron                                |
| `CategorySection` | `category: CategoryKey`, `paths: ResponsibilityPath[]`, `onPathClick: (id: string) => void`       | Section header (icon + label + count) + grid of QuestionCard                                 |
| `BrowseContent`   | `pathsByCategory: Record<CategoryKey, ResponsibilityPath[]>`, `onPathClick: (id: string) => void` | Stacks 6 CategorySection in CATEGORY_ORDER                                                   |
| `ContactCard`     | `contact: Contact`                                                                                | Single contact card with green left border, name, role, email/phone                          |
| `AnswerCard`      | `path: ResponsibilityPath`, `onBackClick: () => void`                                             | Header with category badge + question + summary, two-column contact + steps, feedback widget |

Use the existing `Contact` and `ResponsibilityPath` types from `@/types/responsibility`. Convert the prototype's `MockContact` and `MockPath` types into the real types.

**Tests per subcomponent (8-10 each):**

- Renders required content
- Calls callbacks on click
- Handles missing optional fields (no phone, no description)
- Edge cases (empty steps array, single step)

Commit after each subcomponent. Total: ~8 commits in this task.

### Task 5.3: Build the top-level HulpPage component

**Files:**

- Modify: `apps/web/src/components/hulp/HulpPage/HulpPage.tsx`
- Modify: `apps/web/src/components/hulp/HulpPage/HulpPage.test.tsx`

**Step 1: Write the test**

Test cases:

- Renders PageHero with label "Help", headline "Vind de juiste persoon"
- Renders the search input
- Renders BrowseContent when no question is selected
- Switches to AnswerCard view when a question is selected via URL param `?id=`
- Calls analytics events on search input, on question click, on contact click
- Empty search query results in browse view
- Search query with results shows filtered cards
- Search query with NO results shows the empty state
- Back button (in answer view) returns to browse

**Step 2: Run test, verify failure**

**Step 3: Implement HulpPage**

```typescript
"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SectionStack, type SectionConfig } from "@/components/design-system/SectionStack/SectionStack";
import { PageHero } from "@/components/design-system/PageHero/PageHero";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";
import { useResponsibilityAnalytics } from "@/hooks/useResponsibilityAnalytics";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import type { ResponsibilityPath } from "@/types/responsibility";
import { HulpSearchInput } from "./HulpSearchInput";
import { BrowseContent } from "./BrowseContent";
import { AnswerCard } from "./AnswerCard";
import { CATEGORY_ORDER, type CategoryKey } from "./categoryMeta";

export interface HulpPageProps {
  paths: ResponsibilityPath[];
}

export function HulpPage({ paths }: HulpPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get("id");

  const [searchQuery, setSearchQuery] = useState("");

  const { results: searchResults } = useSemanticSearch({
    query: searchQuery,
    paths,
  });

  const pathsByCategory = useMemo(() => {
    const grouped = {} as Record<CategoryKey, ResponsibilityPath[]>;
    CATEGORY_ORDER.forEach((cat) => (grouped[cat] = []));
    paths.forEach((p) => {
      if (CATEGORY_ORDER.includes(p.category as CategoryKey)) {
        grouped[p.category as CategoryKey].push(p);
      }
    });
    return grouped;
  }, [paths]);

  const selectedPath = selectedId ? paths.find((p) => p.id === selectedId) : null;

  const analytics = useResponsibilityAnalytics();

  const handlePathClick = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("id", id);
    router.push(url.pathname + url.search);
    const path = paths.find((p) => p.id === id);
    if (path) analytics.trackSuggestionClicked({ pathId: id, category: path.category, position: 0 });
  };

  const handleBack = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("id");
    router.push(url.pathname + url.search);
  };

  const sections: SectionConfig[] = [
    {
      key: "hero",
      bg: "kcvv-black",
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      content: <PageHero size="compact" gradient="dark" label="Help" headline="Vind de juiste persoon" body="Stel je vraag of blader door de categorieën hieronder." />,
      transition: { type: "diagonal", direction: "right", overlap: "full" },
    },
    {
      key: "content",
      bg: "gray-100",
      content: (
        <div className="mx-auto max-w-inner-lg space-y-12 px-4 md:px-10">
          <HulpSearchInput value={searchQuery} onChange={setSearchQuery} />
          {selectedPath ? (
            <AnswerCard path={selectedPath} onBackClick={handleBack} />
          ) : searchQuery && searchResults.length > 0 ? (
            // Render search results as a flat list of QuestionCards
            <SearchResults paths={searchResults} onPathClick={handlePathClick} />
          ) : (
            <BrowseContent pathsByCategory={pathsByCategory} onPathClick={handlePathClick} />
          )}
        </div>
      ),
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "cta",
      bg: "kcvv-green-dark",
      paddingTop: "pt-16",
      paddingBottom: "pb-16",
      content: <SectionCta variant="dark" heading="Niet gevonden wat je zocht?" body="Stuur ons een bericht en we helpen je graag verder." buttonLabel="Contact opnemen" buttonHref="mailto:info@kcvvelewijt.be" />,
    },
  ];

  return <SectionStack sections={sections} />;
}
```

**Step 4: Run tests**

Run: `pnpm --filter @kcvv/web test HulpPage 2>&1 | tail -20`

**Step 5: Commit**

```bash
git add apps/web/src/components/hulp/HulpPage
git commit -m "feat(ui): add new HulpPage component with search + browse + answer view"
```

### Task 5.4: Wire HulpPage into the route

**Files:**

- Modify: `apps/web/src/app/(main)/hulp/page.tsx`

**Step 1: Read the current page**

Run: `cat 'apps/web/src/app/(main)/hulp/page.tsx'`

Note: it fetches responsibility paths from Sanity and passes them to `HelpPage`. Replace `HelpPage` with the new `HulpPage`.

**Step 2: Update the route**

```typescript
import { HulpPage } from "@/components/hulp/HulpPage";
// ... rest unchanged ...
<HulpPage paths={paths} />
```

**Step 3: Run tests**

Run: `pnpm --filter @kcvv/web test 'src/app/(main)/hulp' 2>&1 | tail -20`

**Step 4: Commit**

```bash
git add 'apps/web/src/app/(main)/hulp/page.tsx'
git commit -m "feat(ui): switch /hulp route to new HulpPage component"
```

### Task 5.5: Remove the old HelpPage and ResponsibilityFinder

**Step 1: Confirm no other consumers**

```bash
grep -rn "HelpPage\|ResponsibilityFinder" apps/web/src --include="*.tsx" --include="*.ts" | grep -v "HulpPage\|HulpPageRedesign"
```

If only the old `/hulp` route uses them, proceed to delete. Otherwise, update other consumers first.

**Step 2: Delete the old components**

```bash
rm -rf apps/web/src/components/hulp/HelpPage
rm apps/web/src/components/responsibility/ResponsibilityFinder.tsx
rm apps/web/src/components/responsibility/ResponsibilityFinder.test.tsx
rm apps/web/src/components/responsibility/ResponsibilityFinder.stories.tsx
```

Keep `RelatedPaths.tsx`, `FeedbackWidget.tsx`, `ResponsibilityBlock.tsx` if they're used elsewhere — re-evaluate after deletion if they need updating to fit the new design.

**Step 3: Run type-check**

Run: `pnpm --filter @kcvv/web type-check 2>&1 | grep error | head -20`

Expected: No errors. If errors appear, restore the deleted files and update the consumers to use the new HulpPage components instead.

**Step 4: Run full test suite**

Run: `pnpm --filter @kcvv/web test 2>&1 | tail -10`

**Step 5: Delete the HulpPageRedesign prototype**

```bash
rm -rf apps/web/src/components/hulp/HulpPageRedesign
```

**Step 6: Commit**

```bash
git add -u apps/web/src/components/hulp apps/web/src/components/responsibility
git commit -m "chore(ui): remove old ResponsibilityFinder and HulpPageRedesign prototype"
```

### Task 5.6: Update the homepage ResponsibilityBlock if needed

**Step 1: Read the homepage block**

Run: `cat apps/web/src/components/responsibility/ResponsibilityBlock.tsx`

If it currently uses the old `ResponsibilityFinder`, update it to use the new `HulpSearchInput` (or a compact version) plus a "Naar de helppagina →" link.

**Step 2: Update tests and stories accordingly**

**Step 3: Commit**

```bash
git add apps/web/src/components/responsibility/ResponsibilityBlock.tsx
git commit -m "feat(ui): update homepage ResponsibilityBlock to point to new /hulp"
```

---

## Final cleanup

After all phases are merged:

### Task F.1: Verify no prototype directories remain

```bash
find apps/web/src/components -name "*Redesign" -type d
```

Expected: Empty output.

### Task F.2: Run the full check-all

```bash
pnpm --filter @kcvv/web check-all 2>&1 | tail -20
```

Expected: All green. If build still fails on Sanity env vars, that's an environment issue — not a code issue.

### Task F.3: Visual smoke test in production-like environment

Deploy the worktree branch to a Vercel preview and click through every changed page.

### Task F.4: Update CLAUDE.md

If any architecture documented in CLAUDE.md changed (component locations, design tokens, page routes), update it. Specifically:

- The Hulp page UX has changed substantially — note the new `HulpPage` location and the removal of `ResponsibilityFinder`
- The PlayerCard no longer has `variant` or `isCaptain` props — note this in the design system rules
- BrandedTabs is a new design system component — add to the design system locations table

### Task F.5: Final commit and PR

```bash
git add -u
git commit -m "docs(ui): update CLAUDE.md for redesign cleanup"
git push
gh pr create --title "Page redesigns implementation: PlayerCard + 7 page redesigns" --body "..."
```

---

## Estimated commit count per phase

| Phase                 | Commits |
| --------------------- | ------- |
| Phase 1 — PlayerCard  | 6       |
| Phase 2 — Quick wins  | 3       |
| Phase 3 — Team Detail | 4       |
| Phase 4 — Board pages | 1       |
| Phase 5 — Hulp page   | 8       |
| Final cleanup         | 1       |
| **Total**             | **23**  |

## Risk register

| Risk                                                                          | Mitigation                                                                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| PlayerCard refactor breaks team pages                                         | Phase 1 includes a full grep + update sweep before moving on                                      |
| Hulp page semantic search hook is tightly coupled to old UX                   | Read `useSemanticSearch` early in Phase 5; refactor if needed                                     |
| Tests for Geschiedenis page (HistoryContent.test.tsx) reference old structure | Update tests in same task as the production change                                                |
| Removed `isCaptain` prop is consumed by PSD sync data shape                   | Check the data shape — `isCaptain` may still flow from PSD even if the UI ignores it; that's fine |
| Form column gating misfires when KCVV is the away team                        | Already handled by `highlightTeamId` matching `entry.teamId` regardless of home/away              |
| Build fails on Sanity env vars in worktree                                    | Known issue, unrelated to code; PR uses Vercel preview which has env vars                         |

## Notes for the executor

- **Always read the prototype FIRST** before implementing each phase. The prototypes are the canonical visual reference.
- **Run tests after every code change** — don't batch up changes.
- **Commit after every task**, not at the end of every phase. Small commits make review easier and rollback safer.
- **Delete prototype directories** at the end of each phase, not at the very end. They're a temporary artifact.
- **Use `cn` from `@/lib/utils/cn`** for conditional classes when there are more than 2-3 ternaries.
- **Match the existing test patterns** in the file you're modifying, even if they're not your preferred style — consistency matters.
- **The build step in `check-all` will fail** in the worktree because Sanity env vars aren't set there. Skip it locally; rely on Vercel preview / CI for the build check.
