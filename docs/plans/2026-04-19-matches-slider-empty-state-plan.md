# Matches Slider Empty-State + Padding Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a designed empty-state placeholder for the homepage matches slider (shown ~2-3 months/year during off-season), fix the slider section's padding asymmetry, and clean up inline social URLs by extracting them to `EXTERNAL_LINKS` (with Twitter removed everywhere).

**Architecture:** New `MatchesSliderEmptyState` component rendered by `MatchesSliderSection` when `matches.length === 0`, backed by an optional `matchesSliderPlaceholder` Sanity object on the home-page document. Layered content rule: Sanity `nextSeasonKickoff` → countdown, else `announcementText` → announcement, else motto baseline. Two layout candidates (split 2:1, centered card) ship together in Storybook; losing layout deleted after visual review.

**Tech Stack:** Next.js 15 (ISR), React 19 Server Components, Tailwind v4 tokens, Sanity object schema, Effect Schema decoders, `next/image`, Storybook 10, Vitest, Lucide icons.

**Design doc:** `docs/plans/2026-04-19-matches-slider-empty-state-design.md` — read this before starting. All copy, token choices, and the variant matrix live there.

**Issue:** [#1323](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1323)

---

## Prerequisites

- Run in a worktree (`/ralph create 1323`). Never commit to `main`.
- `pnpm install` at repo root; ensure Storybook starts (`pnpm --filter @kcvv/web storybook`).
- Default photo is a **free stock image** fetched during Task 8 — the real brand photo can be swapped in later via the Sanity `highlightImage` override without touching code.

## Conventions

- Conventional commits with scope: `ui` for component work, `schema` for Sanity, `config` for constants, `deps` where applicable.
- After every task that changes code: `pnpm --filter @kcvv/web lint:fix && pnpm --filter @kcvv/web check-all`. Do not commit if checks fail.
- TDD where the logic is testable (decision rules, URL constants, schema exports). Stories are the visual tests for layout work.
- Keep commits small. One task = one commit (tests + implementation together unless the task explicitly says otherwise).

---

## Phase 1 — Cleanup: `EXTERNAL_LINKS` + Twitter removal

Do cleanup first so Phase 3's CTA wiring uses the final `EXTERNAL_LINKS` shape from the start.

### Task 1: Extend `EXTERNAL_LINKS` with new URLs

**Files:**

- Modify: `apps/web/src/lib/constants.ts`

**Step 1: Update the constant**

Replace the existing `EXTERNAL_LINKS` block with:

```typescript
export const EXTERNAL_LINKS = {
  webshop: "https://www.brandsfit.com/kcvvelewijt/nl-eu",
  psdDashboard: "https://kcvv.prosoccerdata.com/dashboard",
  facebook: "https://facebook.com/KCVVElewijt/",
  instagram: "https://www.instagram.com/kcvve",
} as const;
```

Also remove `twitterHandle: "kcvve",` from `SITE_CONFIG`.

**Step 2: Run type-check**

```bash
pnpm --filter @kcvv/web typecheck
```

Expected: fails with references to `twitterHandle` from at least `layout.tsx` and `metadata.test.ts`. That's fine — we'll fix them next.

**Step 3: Commit**

```bash
git add apps/web/src/lib/constants.ts
git commit -m "config(ui): extend EXTERNAL_LINKS with PSD + social URLs, drop twitterHandle"
```

---

### Task 2: Remove Twitter from `SocialLinks`

**Files:**

- Modify: `apps/web/src/components/design-system/SocialLinks/SocialLinks.tsx`
- Modify: `apps/web/src/components/design-system/SocialLinks/SocialLinks.test.tsx`

**Step 1: Update the failing test expectations first**

Open `SocialLinks.test.tsx`. Any assertion that expects a Twitter link or counts three icons → reduce to two and drop the Twitter case.

**Step 2: Update `SocialLinks.tsx` to use `EXTERNAL_LINKS`**

Replace the inline `socialLinks` array with:

```typescript
import { EXTERNAL_LINKS } from "@/lib/constants";
import { Facebook, Instagram } from "@/lib/icons";

const socialLinks = [
  { name: "Facebook", url: EXTERNAL_LINKS.facebook, icon: Facebook },
  { name: "Instagram", url: EXTERNAL_LINKS.instagram, icon: Instagram },
];
```

Remove the `Twitter` import from the top.

**Step 3: Run tests**

```bash
pnpm --filter @kcvv/web vitest run SocialLinks
```

Expected: PASS.

**Step 4: Commit**

```bash
git add apps/web/src/components/design-system/SocialLinks/
git commit -m "refactor(ui): read social URLs from EXTERNAL_LINKS, remove Twitter"
```

---

### Task 3: Remove Twitter from icon barrel + Foundation story

**Files:**

- Modify: `apps/web/src/lib/icons.ts` — remove `Twitter` export
- Modify: `apps/web/src/stories/foundation/SpacingAndIcons.mdx` — remove Twitter from icon grid
- Modify: `apps/web/src/components/design-system/Icon/Icon.stories.tsx` — remove if it references Twitter

**Step 1: Grep for remaining imports**

```bash
grep -rn "from \"@/lib/icons\"" apps/web/src | xargs grep -l "Twitter" 2>/dev/null || true
```

Expected: should return empty after Task 2. If anything remains, address it before removing the export.

**Step 2: Remove `Twitter` from each file above**

**Step 3: Run typecheck + tests**

```bash
pnpm --filter @kcvv/web typecheck
pnpm --filter @kcvv/web vitest run
```

Expected: PASS.

**Step 4: Commit**

```bash
git add apps/web/src/lib/icons.ts apps/web/src/stories/ apps/web/src/components/design-system/Icon/
git commit -m "chore(ui): drop Twitter icon from barrel and foundation docs"
```

---

### Task 4: Remove Twitter share buttons and metadata

**Files:**

- Modify: `apps/web/src/components/article/ArticleMetadata/ArticleMetadata.tsx` — drop Twitter share button
- Modify: `apps/web/src/components/article/ArticleMetadata/ArticleMetadata.test.tsx`
- Modify: `apps/web/src/components/article/ArticleMetadata/ArticleMetadata.stories.tsx`
- Modify: `apps/web/src/components/player/PlayerShare/PlayerShare.tsx` — drop Twitter share button
- Modify: `apps/web/src/components/player/PlayerShare/PlayerShare.test.tsx`
- Modify: `apps/web/src/components/player/PlayerShare/PlayerShare.stories.tsx`
- Modify: `apps/web/src/app/layout.tsx` — remove `twitter:` OG/metadata entries
- Modify: `apps/web/src/app/metadata.test.ts` — remove Twitter assertions
- Modify: `apps/web/src/lib/seo/jsonld.ts` — remove Twitter from `sameAs` in `buildSportsClubJsonLd` if present
- Modify: `apps/web/src/lib/seo/jsonld.test.ts`
- Modify: `apps/web/public/llms.txt` — remove Twitter mention

**Step 1: Do the removals one file at a time. For each share component:**

- Remove the `Twitter` icon import.
- Delete the Twitter share button JSX block.
- Delete any `handleTwitterShare` / `shareOnTwitter` helper that is no longer used.
- Update tests to remove Twitter-specific assertions; make sure at least one other share path is still asserted.
- Update stories to drop any Twitter-only variant.

**Step 2: Run full test suite**

```bash
pnpm --filter @kcvv/web lint:fix
pnpm --filter @kcvv/web check-all
```

Expected: PASS. If metadata snapshot tests fail, update the snapshot intentionally — no more `twitter:` fields are expected.

**Step 3: Commit**

```bash
git add -A apps/web/
git commit -m "chore(ui): remove Twitter share buttons, metadata, and JSON-LD references"
```

**Step 4: Verify no Twitter references remain (script sanity check)**

```bash
grep -ri "twitter" apps/web/src apps/web/public | grep -v ".next" || echo "clean"
```

Expected: `clean` (or only matches inside test-fixture strings that are explicitly checking _absence_).

---

## Phase 2 — Sanity schema

### Task 5: Create the `matchesSliderPlaceholder` schema

**Files:**

- Create: `packages/sanity-schemas/src/matchesSliderPlaceholder.ts`

**Step 1: Write the schema file**

Copy the schema definition from the **Sanity schema** section of the design doc (`docs/plans/2026-04-19-matches-slider-empty-state-design.md`). The file exports a single `defineType` object.

**Step 2: Typecheck the package**

```bash
pnpm --filter @kcvv/sanity-schemas typecheck
```

Expected: PASS.

**Step 3: Commit**

```bash
git add packages/sanity-schemas/src/matchesSliderPlaceholder.ts
git commit -m "schema: add matchesSliderPlaceholder object type"
```

---

### Task 6: Register schema and embed on home-page document

**Files:**

- Modify: `packages/sanity-schemas/src/index.ts` — export `matchesSliderPlaceholder`, add to schema types array
- Modify: `packages/sanity-schemas/src/homePage.ts` — add new field

**Step 1: Export from barrel**

Add to `index.ts`:

```typescript
export { matchesSliderPlaceholder } from "./matchesSliderPlaceholder";
```

And include in the schema types array next to other object types.

**Step 2: Add field to `homePage.ts`**

Insert in `fields`:

```typescript
defineField({
  name: "matchesSliderPlaceholder",
  title: "Placeholder wedstrijdenblok",
  type: "matchesSliderPlaceholder",
  description:
    "Optioneel. Getoond wanneer er geen aankomende wedstrijden zijn.",
}),
```

**Step 3: Verify both studios build**

```bash
pnpm --filter @kcvv/studio build
pnpm --filter @kcvv/studio-staging build
```

Expected: PASS.

**Step 4: Commit**

```bash
git add packages/sanity-schemas/ apps/studio/ apps/studio-staging/
git commit -m "schema(home): embed optional matchesSliderPlaceholder field"
```

---

### Task 7: Extend GROQ query and typed decoder

**Files:**

- Modify: wherever the home-page GROQ query lives (find via `grep -rn "homePage\b" apps/web/src/lib` — likely `apps/web/src/lib/sanity/queries.ts` or similar)
- Modify: the Effect Schema decoder for the home-page result (find via `grep -rn "homePage" apps/web/src/lib/effect`)
- Create (maybe): `apps/web/src/lib/effect/schemas/matchesSliderPlaceholder.schema.ts` if the pattern is one-schema-per-object

**Step 1: Locate the files**

```bash
grep -rn "homePage" apps/web/src/lib
```

Open both the GROQ query and the Effect Schema definition.

**Step 2: Extend the GROQ projection**

Append to the home-page projection:

```groq
matchesSliderPlaceholder {
  nextSeasonKickoff,
  announcementText,
  announcementHref,
  highlightImage {
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

**Step 3: Extend the Effect Schema decoder**

Add a schema class `MatchesSliderPlaceholder` mirroring the schema, all fields `S.optional`. Use `DateFromStringOrDate` (already in the codebase — memory confirms) for `nextSeasonKickoff`.

**Step 4: Write a decoder test**

In the same test file as the home-page decoder (or a new one if the pattern dictates), test that:

- A payload with all fields set decodes correctly.
- An empty object decodes with all fields `undefined`.
- A past date for `nextSeasonKickoff` still decodes (business logic filters, not the decoder).

Run:

```bash
pnpm --filter @kcvv/web vitest run matchesSliderPlaceholder
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/lib/
git commit -m "feat(schema): query + decode matchesSliderPlaceholder from Sanity"
```

---

## Phase 3 — Empty-state component

### Task 8: Scaffold component and add default photo

**Files:**

- Create: `apps/web/public/images/home/matches-empty-state.jpg` (downloaded stock photo)
- Create: `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.tsx`
- Create: `apps/web/src/components/home/MatchesSliderEmptyState/index.ts`

**Step 1: Download a free stock photo**

Ensure the directory exists:

```bash
mkdir -p apps/web/public/images/home
```

Download a royalty-free landscape photo of football fans / stadium atmosphere from **Unsplash** (https://unsplash.com — free for commercial use, no attribution required). Suggested search terms, in order of preference:

1. `football crowd stadium`
2. `soccer fans`
3. `amateur football pitch`

Pick a **landscape** photo (aspect ratio ~16:9), minimum 1920×1080, and download the full-resolution JPEG to:

```bash
apps/web/public/images/home/matches-empty-state.jpg
```

If Unsplash is unreachable, fall back to **Pexels** (https://pexels.com) with the same search terms and same license guarantees.

Optimize the file to keep it under 400 KB (use `sharp`, `squoosh`, or any local tool):

```bash
# example using sharp-cli if installed; otherwise any equivalent works
npx sharp-cli -i apps/web/public/images/home/matches-empty-state.jpg -o apps/web/public/images/home/matches-empty-state.jpg --format jpeg --quality 80 --resize 1920
```

Verify the file:

```bash
ls -lh apps/web/public/images/home/matches-empty-state.jpg
```

Expected: file exists, size under 400 KB, dimensions ≥1920×1080.

**Note:** this is a temporary stand-in. The real brand photo can replace it later via the Sanity `highlightImage` override — no redeploy required, just a Sanity edit.

**Step 2: Scaffold the component (baseline layout B only for now)**

```typescript
import Image from "next/image";
import { Button, Icon } from "@/components/design-system";
import { ExternalLink, Facebook } from "@/lib/icons";
import { EXTERNAL_LINKS } from "@/lib/constants";
import type { MatchesSliderPlaceholder } from "@/lib/effect/schemas/matchesSliderPlaceholder.schema";

export interface MatchesSliderEmptyStateProps {
  placeholder?: MatchesSliderPlaceholder;
  layout?: "split" | "centered";
}

export const MatchesSliderEmptyState = ({
  placeholder,
  layout = "split",
}: MatchesSliderEmptyStateProps) => {
  // TODO Task 11: decision rule
  // TODO Task 12: countdown
  // TODO Task 13: announcement
  // TODO Task 14: highlightImage override

  return layout === "split" ? renderSplit() : renderCentered();
};
```

Implement **baseline-only** versions of `renderSplit` and `renderCentered`:

- Split: `grid-cols-1 md:grid-cols-3`, photo `md:col-span-2`, content `md:col-span-1`. Uses the default `/images/home/matches-empty-state.jpg`.
- Centered: `max-w-2xl mx-auto text-center` with photo and content stacked.

Typography/tokens exactly as the design doc's **Typography + tokens** section.

Barrel (`index.ts`):

```typescript
export { MatchesSliderEmptyState } from "./MatchesSliderEmptyState";
export type { MatchesSliderEmptyStateProps } from "./MatchesSliderEmptyState";
```

**Step 3: Run typecheck**

```bash
pnpm --filter @kcvv/web typecheck
```

Expected: PASS.

**Step 4: Commit**

```bash
git add apps/web/public/images/home/ apps/web/src/components/home/MatchesSliderEmptyState/
git commit -m "feat(ui): scaffold MatchesSliderEmptyState with baseline motto"
```

---

### Task 9: Storybook — baseline stories for both layouts

**Files:**

- Create: `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.stories.tsx`

**Step 1: Write the stories file**

- Title: `Features/Home/MatchesSliderEmptyState`
- `tags: ["autodocs"]`
- Decorator wrapping each story in a `kcvv-black` section that mirrors `SectionStack`'s default padding.
- Two initial stories: `SplitBaseline`, `CenteredBaseline`.

Follow the project's story authoring rules (from `apps/web/CLAUDE.md`):

- `fn()` from `storybook/test` for any handler args (none expected here).
- `StoryObj<typeof meta>`.
- No non-null assertions.

**Step 2: Start Storybook and verify both stories render**

```bash
pnpm --filter @kcvv/web storybook
```

Visually check at desktop + mobile viewports.

**Step 3: Commit**

```bash
git add apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.stories.tsx
git commit -m "test(ui): baseline Storybook stories for MatchesSliderEmptyState (split + centered)"
```

---

### Task 10: Decision-rule helpers + tests

**Files:**

- Create: `apps/web/src/components/home/MatchesSliderEmptyState/decisionRule.ts`
- Create: `apps/web/src/components/home/MatchesSliderEmptyState/decisionRule.test.ts`

**Step 1: Write the failing tests first**

```typescript
import { describe, it, expect } from "vitest";
import { resolveContent } from "./decisionRule";

describe("resolveContent", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("returns motto baseline when no placeholder data", () => {
    const result = resolveContent(undefined, now);
    expect(result).toEqual({
      mode: "baseline",
      eyebrow: "TUSSENSEIZOEN",
    });
  });

  it("returns countdown when future kickoff date is set", () => {
    const result = resolveContent(
      { nextSeasonKickoff: new Date("2026-08-10T00:00:00Z") },
      now,
    );
    expect(result.mode).toBe("countdown");
    expect(result.eyebrow).toBe("NIEUW SEIZOEN");
    expect(result.daysUntil).toBe(70);
  });

  it("treats past kickoff date as unset", () => {
    const result = resolveContent(
      { nextSeasonKickoff: new Date("2026-05-01T00:00:00Z") },
      now,
    );
    expect(result.mode).toBe("baseline");
  });

  it("uses singular copy when daysUntil === 1", () => {
    const result = resolveContent(
      { nextSeasonKickoff: new Date("2026-06-02T00:00:00Z") },
      now,
    );
    expect(result.mode).toBe("countdown");
    expect(result.daysUntil).toBe(1);
  });

  it("uses 'today' copy when daysUntil === 0", () => {
    const result = resolveContent(
      { nextSeasonKickoff: new Date("2026-06-01T00:00:00Z") },
      now,
    );
    expect(result.mode).toBe("today");
  });

  it("returns announcement when only announcementText is set", () => {
    const result = resolveContent(
      { announcementText: "Kalender volgende week online" },
      now,
    );
    expect(result.mode).toBe("announcement");
    expect(result.eyebrow).toBe("MEDEDELING");
  });

  it("countdown takes precedence over announcement", () => {
    const result = resolveContent(
      {
        nextSeasonKickoff: new Date("2026-08-10T00:00:00Z"),
        announcementText: "Kalender volgende week online",
      },
      now,
    );
    expect(result.mode).toBe("countdown");
    expect(result.secondary).toBe("Kalender volgende week online");
  });
});
```

**Step 2: Run the test to verify it fails**

```bash
pnpm --filter @kcvv/web vitest run decisionRule
```

Expected: FAIL (no `resolveContent` function yet).

**Step 3: Implement `decisionRule.ts`**

Export a `resolveContent(placeholder?, now?)` function returning a discriminated union:

```typescript
type ResolvedContent =
  | { mode: "baseline"; eyebrow: "TUSSENSEIZOEN" }
  | {
      mode: "countdown";
      eyebrow: "NIEUW SEIZOEN";
      daysUntil: number;
      kickoffDate: Date;
      secondary?: string;
    }
  | {
      mode: "today";
      eyebrow: "NIEUW SEIZOEN";
      kickoffDate: Date;
      secondary?: string;
    }
  | {
      mode: "announcement";
      eyebrow: "MEDEDELING";
      text: string;
      href?: string;
    };
```

Day count uses `differenceInCalendarDays` from `date-fns` (verify it's a dep with `grep date-fns apps/web/package.json`). Accept `now` as an optional parameter defaulted to `new Date()` so tests can inject.

**Step 4: Run tests again**

```bash
pnpm --filter @kcvv/web vitest run decisionRule
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/home/MatchesSliderEmptyState/decisionRule.ts apps/web/src/components/home/MatchesSliderEmptyState/decisionRule.test.ts
git commit -m "feat(ui): decision rule for MatchesSliderEmptyState content modes"
```

---

### Task 11: Wire decision rule into component + countdown rendering

**Files:**

- Modify: `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.tsx`

**Step 1: Integrate `resolveContent`**

Inside the component, call `resolveContent(placeholder)` once at the top and render different primary/secondary lines per `result.mode`.

Copy strings (Dutch) come from the design doc's **Copy** table — use it verbatim.

For countdown:

- Primary: `Nog <strong class="text-kcvv-green-bright">{daysUntil} dag{s}</strong> tot het nieuwe seizoen`
- Secondary: `Aftrap op {formatDate(kickoffDate, "EEEE d MMMM", { locale: nl })}`

**Step 2: Add stories for countdown variants**

Append to `MatchesSliderEmptyState.stories.tsx`:

- `SplitCountdown`, `CenteredCountdown` (with `nextSeasonKickoff: new Date("2026-08-10T00:00:00Z")`)
- `SplitCountdownToday`, `CenteredCountdownToday` (date = today)

**Step 3: Run Storybook + visual check**

```bash
pnpm --filter @kcvv/web storybook
```

Verify countdown renders correctly, singular/plural handled.

**Step 4: Run tests**

```bash
pnpm --filter @kcvv/web vitest run MatchesSliderEmptyState
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/home/MatchesSliderEmptyState/
git commit -m "feat(ui): render countdown mode in MatchesSliderEmptyState"
```

---

### Task 12: Announcement mode + remaining variant stories

**Files:**

- Modify: `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.tsx`
- Modify: `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.stories.tsx`

**Step 1: Render announcement + combined modes**

Add rendering for `mode === "announcement"` and make `countdown` handle an optional `secondary` that carries `announcementText` + optional inline link to `announcementHref`.

**Step 2: Add stories**

Complete the matrix for both layouts (per the design doc's variant matrix):

- `*Announcement`
- `*CountdownAndAnnouncement`
- `*CustomImage` (uses Sanity `highlightImage` mock — create a fixture with a known URL from `apps/web/public/images/home/matches-empty-state.jpg` or similar placeholder)
- `*AllFieldsPopulated`

**Step 3: Render custom image when `highlightImage?.asset?.url` is set**

Override the `src` of the `next/image` with the Sanity URL; otherwise use the default committed asset. Pass `alt` from the Sanity field (required per schema).

**Step 4: Run Storybook + tests**

```bash
pnpm --filter @kcvv/web storybook
pnpm --filter @kcvv/web vitest run MatchesSliderEmptyState
```

Expected: all 12 stories render; tests PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/home/MatchesSliderEmptyState/
git commit -m "feat(ui): announcement + custom image modes + complete variant matrix"
```

---

## Phase 4 — Wire-up

### Task 13: Fetch placeholder on homepage and pass to section

**Files:**

- Modify: `apps/web/src/app/page.tsx` — add to data fetching and pass prop
- Modify: `apps/web/src/components/home/MatchesSliderSection/MatchesSliderSection.tsx` — accept prop, render empty state instead of `null`

**Step 1: Update `MatchesSliderSection`**

Replace the `matches.length === 0` early return with:

```typescript
if (matches.length === 0) {
  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader
          title="Wedstrijden"
          linkText="Alle wedstrijden"
          linkHref="/kalender"
          variant="dark"
        />
        <MatchesSliderEmptyState placeholder={placeholder} />
      </div>
    </section>
  );
}
```

Add `placeholder?: MatchesSliderPlaceholder` to the props interface.

**Step 2: Update `page.tsx`**

Destructure `matchesSliderPlaceholder` from the home-page fetch result. Pass it in at line 260-266:

```typescript
const matchesSliderSection: SectionConfig = {
  key: "matches-slider",
  bg: "kcvv-black",
  content: (
    <MatchesSliderSection
      matches={sliderMatches}
      highlightTeamId={1235}
      placeholder={matchesSliderPlaceholder}
    />
  ),
  paddingBottom: "pb-16", // Task 14 tunes if needed
};
```

**Step 3: Run build + dev server**

```bash
pnpm --filter @kcvv/web build
pnpm --filter @kcvv/web dev
```

Expected: build PASSES. In dev, confirm populated slider renders normally (can't easily force empty state without Sanity data — use Storybook for that).

**Step 4: Update existing `MatchesSliderSection` tests/stories**

- Add a story `EmptyWithoutPlaceholder` that renders the empty state with no Sanity data.
- Add a story `EmptyWithCountdown` that passes a mock placeholder with a future date.

**Step 5: Run check-all**

```bash
pnpm --filter @kcvv/web check-all
```

Expected: PASS.

**Step 6: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/components/home/MatchesSliderSection/
git commit -m "feat(matches): render empty-state placeholder on homepage matches slider"
```

---

### Task 14: Padding asymmetry fix (scoped override)

**Files:**

- Modify: `apps/web/src/app/page.tsx` (single line)

**Step 1: Start dev server and measure**

```bash
pnpm --filter @kcvv/web dev
```

Open the homepage in the browser. Use DevTools to measure the pixel gap between:

- Top diagonal edge → top of "WEDSTRIJDEN" heading (let's call it T).
- Bottom of last card → bottom diagonal edge (B).

Record both.

**Step 2: Decide override**

If B > T by > 10px: add `paddingBottom: "pb-16"` to `matchesSliderSection` in `page.tsx` and reload.

If still B > T: try `"pb-14"`. If B < T: raise to `"pb-18"`.

Do **not** change `SectionStack` defaults or `SectionHeader.mb-10`. Scope stays on `page.tsx`.

**Step 3: Verify with empty state too**

Temporarily force `sliderMatches = []` in `page.tsx` to confirm the empty-state variant renders with the same visual balance. Revert the temporary change before committing.

**Step 4: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "fix(ui): even top/bottom padding on homepage matches slider section"
```

---

## Phase 5 — Visual review + final checks

### Task 15: Pick the winning layout and delete the loser

**Files:**

- Modify: `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.tsx` — remove the losing branch
- Modify: `apps/web/src/components/home/MatchesSliderEmptyState/MatchesSliderEmptyState.stories.tsx` — delete losing-layout stories
- Update: design doc Section 4 note ("Layout B won, C deleted").

**Step 1: Present both layouts side by side to the user**

Use Storybook at desktop and mobile viewports. Confirm the winner out loud before touching code.

**Step 2: Delete the losing branch**

Remove the `layout` prop if both were gated on it — the winning rendering becomes the only rendering. Simplify the component signature.

**Step 3: Delete losing stories**

**Step 4: Run check-all**

```bash
pnpm --filter @kcvv/web lint:fix
pnpm --filter @kcvv/web check-all
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/home/MatchesSliderEmptyState/ docs/plans/
git commit -m "refactor(ui): settle on <winner> layout for MatchesSliderEmptyState"
```

---

### Task 16: Final audit + README/CLAUDE.md check

**Step 1: Re-read design doc and plan**

Open `docs/plans/2026-04-19-matches-slider-empty-state-design.md` and this plan. Confirm every file path, script name, and code snippet still matches the current tree (project convention — see `Plan and Doc Audit Before Closing a Branch` in root `CLAUDE.md`).

**Step 2: CLAUDE.md check**

This plan does not add a new package or rename paths — no CLAUDE.md update required. Confirm by re-reading root and `apps/web/CLAUDE.md`.

**Step 3: Storybook build smoke test**

```bash
pnpm --filter @kcvv/web build-storybook
```

Expected: PASS.

**Step 4: Full monorepo check**

```bash
pnpm turbo check-all
```

Expected: PASS.

**Step 5: Grep no-regressions pass**

```bash
grep -rn "Twitter\|twitter" apps/web/src apps/web/public | grep -v ".next\|absence" || echo "clean"
grep -rn "instagram.com\|facebook.com" apps/web/src | grep -v "constants.ts\|EXTERNAL_LINKS" || echo "no stragglers"
```

Expected: `clean` and `no stragglers`.

**Step 6: Commit any final tweaks**

```bash
git add -A
git commit -m "chore(ui): final audit for matches slider empty state"
```

---

## Open sanity migration note

When deploying, run the Sanity studio migration path as per project convention (see `feedback_sanity_migrations.md`): staging first, verify placeholder editing works in staging studio UI, then production. Since every new field is optional, no data migration is required.

## Execution handoff

Two execution options:

1. **Subagent-driven (this session)** — I dispatch fresh subagent per task, review between tasks.
2. **Parallel session (separate)** — You open a new session in a worktree and use `superpowers:executing-plans`.

Either way, **must be in a worktree, not `main`**.
