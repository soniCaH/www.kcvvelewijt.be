# Homepage v3 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all homepage v3 blocks in Next.js as defined in `docs/plans/2026-03-16-homepage-v3-design.md`.

**Architecture:** Build new components bottom-up (primitives first, sections last), keep existing components as baseline, wire everything together on the homepage page.tsx in the final task.

**Tech Stack:** Next.js 15, TypeScript strict, Tailwind CSS v4, Vitest + React Testing Library, Storybook 10, Lucide React, Sanity, Effect.

**Important:** The mockup (`docs/mockups/homepage-v3.html`) is for style direction only. The current live component code is the baseline. Each modified component must feel native to the existing codebase.

---

## Branch

```bash
git checkout -b feat/homepage-v3
```

---

### Task 1: MatchTeaser — `teamLabel` prop + dark-theme variant

**Files:**

- Modify: `apps/web/src/components/match/MatchTeaser/MatchTeaser.tsx`
- Modify: `apps/web/src/components/match/MatchTeaser/MatchTeaser.test.tsx`
- Modify: `apps/web/src/components/match/MatchTeaser/MatchTeaser.stories.tsx`

**Step 1: Write failing tests**

Add to `MatchTeaser.test.tsx` under a new `describe("teamLabel")` block:

```typescript
describe("teamLabel", () => {
  it("renders teamLabel badge above date row", () => {
    render(<MatchTeaser {...defaultProps} teamLabel="A-Ploeg" />);
    expect(screen.getByText("A-Ploeg")).toBeInTheDocument();
  });

  it("does not render teamLabel badge when absent", () => {
    const { container } = render(<MatchTeaser {...defaultProps} />);
    // No empty badge element — verify no data-testid="team-label"
    expect(container.querySelector("[data-testid='team-label']")).toBeNull();
  });
});

describe("dark theme", () => {
  it("renders dark container classes when theme=dark", () => {
    const { container } = render(
      <MatchTeaser {...defaultProps} theme="dark" />,
    );
    expect(container.firstChild).toHaveClass("bg-kcvv-black");
    expect(container.firstChild).not.toHaveClass("bg-white");
  });

  it("renders light container classes by default", () => {
    const { container } = render(<MatchTeaser {...defaultProps} />);
    expect(container.firstChild).toHaveClass("bg-white");
  });
});
```

**Step 2: Run test to confirm failure**

```bash
pnpm --filter @kcvv/web test src/components/match/MatchTeaser/MatchTeaser.test.tsx
```

Expected: FAIL — `teamLabel`, `theme` props don't exist yet.

**Step 3: Implement changes in `MatchTeaser.tsx`**

Add to `MatchTeaserProps`:

```typescript
/** Optional team label shown as a small green badge above the date row (e.g. "A-Ploeg") */
teamLabel?: string;
/** Theme variant — "dark" for dark-background sections */
theme?: "light" | "dark";
```

In the component body, derive `isDark = theme === "dark"`.

Update `containerClasses`:

```typescript
const containerClasses = cn(
  "block border rounded transition-shadow",
  isDark
    ? "bg-kcvv-black border-white/8 hover:border-white/20"
    : "bg-white border-gray-200 hover:shadow-md",
  isCompact ? "p-3" : "p-4",
  className,
);
```

Render `teamLabel` before the header row:

```tsx
{
  teamLabel && (
    <div
      data-testid="team-label"
      className="mb-1 text-xs font-bold uppercase tracking-widest text-kcvv-green"
    >
      {teamLabel}
    </div>
  );
}
```

Update date/time text colours in the header row, passing `isDark` into the header section:

```tsx
<span className={cn("font-medium", isDark ? "text-white/70" : "text-gray-900")}>
  {formatDate(date)}
</span>;
{
  time && (
    <span className={cn(isDark ? "text-white/50" : "text-gray-500")}>
      {time}
    </span>
  );
}
```

Update `VS` separator:

```tsx
<span className={cn("font-medium", isDark ? "text-white/30" : "text-gray-400")}>
  VS
</span>
```

Update `StatusBadge` — add `isDark` prop and swap bg when dark:

```typescript
function StatusBadge({
  status,
  isDark,
}: {
  status: MatchTeaserProps["status"];
  isDark?: boolean;
}) {
  if (status === "postponed") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium",
          isDark
            ? "bg-orange-900/40 text-orange-300"
            : "bg-orange-100 text-orange-800",
        )}
      >
        Uitgesteld
      </span>
    );
  }
  if (status === "stopped") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium",
          isDark
            ? "bg-orange-900/40 text-orange-300"
            : "bg-orange-100 text-orange-800",
        )}
      >
        Gestopt
      </span>
    );
  }
  if (status === "forfeited") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium",
          isDark
            ? "bg-white/10 text-white/60"
            : "bg-gray-100 text-gray-700",
        )}
      >
        FF
      </span>
    );
  }
  return null;
}
```

Update `TeamDisplay` — add `isDark` prop:

```typescript
function TeamDisplay({
  team,
  side,
  isHighlighted,
  compact,
  isDark,
}: { ...; isDark?: boolean }) {
```

Team name span:

```tsx
<span
  className={cn(
    "truncate",
    compact ? "text-sm" : "text-base",
    side === "away" && "text-right",
    isDark
      ? isHighlighted
        ? "font-bold text-white"
        : "text-white/85"
      : isHighlighted
        ? "font-semibold text-gray-900"
        : "text-gray-700",
  )}
>
```

Fallback initial letter for dark theme:

```tsx
<div
  className={cn(
    "rounded-full flex items-center justify-center flex-shrink-0",
    compact ? "w-6 h-6" : "w-8 h-8",
    isDark ? "bg-white/15" : "bg-gray-200",
  )}
>
  <span
    className={cn(
      compact ? "text-xs" : "text-sm",
      isDark ? "text-white/60" : "text-gray-500",
    )}
  >
    {team.name.charAt(0)}
  </span>
</div>
```

Score display — winning team in `kcvv-green` (same in both themes):

```tsx
<span
  className={cn(
    isHomeHighlighted && score.home > score.away && "text-kcvv-green",
    !(isHomeHighlighted && score.home > score.away) &&
      (isDark ? "text-white" : "text-gray-900"),
  )}
>
  {score.home}
</span>
```

Pass `isDark` to both `StatusBadge` and `TeamDisplay` callsites.

**Step 4: Run tests to confirm pass**

```bash
pnpm --filter @kcvv/web test src/components/match/MatchTeaser/MatchTeaser.test.tsx
```

Expected: all PASS.

**Step 5: Update Storybook stories**

Add to `MatchTeaser.stories.tsx`:

```typescript
export const WithTeamLabel: Story = {
  args: {
    ...Default.args,
    teamLabel: "A-Ploeg",
  },
};

export const DarkTheme: Story = {
  args: {
    ...Default.args,
    theme: "dark",
    teamLabel: "U21",
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};

export const DarkThemeWithScore: Story = {
  args: {
    ...WithScore.args,
    theme: "dark",
    teamLabel: "A-Ploeg",
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};
```

**Step 6: Commit**

```bash
git add apps/web/src/components/match/MatchTeaser/
git commit -m "feat(ui): MatchTeaser — teamLabel badge + dark theme variant"
```

---

### Task 2: MatchTeaser — add `teamLabel` to shared `UpcomingMatch` type

**Files:**

- Modify: `apps/web/src/components/match/types.ts`

**Step 1: Add optional `teamLabel` field**

In `UpcomingMatch`, add:

```typescript
/** Optional team label for display (e.g. "A-Ploeg", "U21") — set by calling page */
teamLabel?: string;
```

This is the cleanest data-flow: calling page sets `teamLabel` during mapping; components pass it through without knowing about team IDs.

No tests needed — this is a type change only.

**Step 2: Commit**

```bash
git add apps/web/src/components/match/types.ts
git commit -m "feat(ui): add teamLabel to UpcomingMatch type"
```

---

### Task 3: MatchesSlider — dark-theme reskin + `teamLabel` passthrough

**Files:**

- Modify: `apps/web/src/components/match/MatchesSlider/MatchesSlider.tsx`
- Modify: `apps/web/src/components/match/MatchesSlider/MatchesSlider.stories.tsx`

No test file exists for MatchesSlider. Do not create one — this component has no testable logic beyond the scroll state which requires a real browser.

**Step 1: Add `theme` prop to `MatchesSliderProps`**

```typescript
/** Theme variant — "dark" for kcvv-black sections */
theme?: "light" | "dark";
```

**Step 2: Reskin arrows for dark theme**

Replace the arrow button `className` with theme-aware classes. For dark theme:

- `kcvv-black` bg, `border border-kcvv-green rounded-sm`, green icon
- Remove `rounded-full` and `shadow-md`

Import `ChevronLeft` and `ChevronRight` from `@/lib/icons` (already exported there). Replace inline SVG paths.

```tsx
import { ChevronLeft, ChevronRight } from "@/lib/icons";

// Left arrow:
className={cn(
  "hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10",
  "w-10 h-10 items-center justify-center transition-colors",
  theme === "dark"
    ? "bg-kcvv-black border border-kcvv-green rounded-sm hover:bg-kcvv-green/10"
    : "bg-white rounded-full shadow-md hover:bg-gray-50",
)}

// Icon inside:
<ChevronLeft
  className={cn("w-5 h-5", theme === "dark" ? "text-kcvv-green" : "text-kcvv-green-dark")}
/>
```

Same for right arrow with `ChevronRight`.

**Step 3: Pass `teamLabel` and `theme` to MatchTeaser**

In the map loop:

```tsx
<MatchTeaser
  ...existing props...
  teamLabel={match.teamLabel}
  theme={theme}
/>
```

**Step 4: Update stories**

Add a dark-theme story:

```typescript
export const DarkTheme: Story = {
  args: {
    matches: mockMatches.mixed.map((m, i) => ({
      ...m,
      teamLabel: i % 2 === 0 ? "A-Ploeg" : "U17",
    })),
    theme: "dark",
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};
```

**Step 5: Commit**

```bash
git add apps/web/src/components/match/MatchesSlider/
git commit -m "feat(ui): MatchesSlider — dark-theme arrows + teamLabel passthrough"
```

---

### Task 4: NewsCard — event card enhancements (Calendar/Clock icons, countdown, external link)

**Goal:** When the featured slot is an event, the card shows date/time with Lucide icons and a countdown chip in the footer. This is done by extending `NewsCard` props and the `LatestNews` → `NewsCard` data flow.

**Files:**

- Modify: `apps/web/src/components/home/LatestNews/NewsCard.tsx`
- Modify: `apps/web/src/components/home/LatestNews/LatestNews.tsx`
- Modify: `apps/web/src/components/home/LatestNews/NewsCard.test.tsx`
- Modify: `apps/web/src/components/home/LatestNews/NewsCard.stories.tsx`

**Step 1: Write failing tests**

Add to `NewsCard.test.tsx`:

```typescript
import { Calendar, Clock, ExternalLink } from "@/lib/icons";

describe("event card features", () => {
  it("renders eventTime with Calendar and Clock icons when time provided", () => {
    render(
      <NewsCard
        title="Sponsorfeest"
        href="/event/1"
        variant="featured"
        eventDate="15 apr"
        eventTime="19:00"
      />,
    );
    expect(screen.getByText("15 apr")).toBeInTheDocument();
    expect(screen.getByText("19:00")).toBeInTheDocument();
  });

  it("renders countdown chip when countdown provided", () => {
    render(
      <NewsCard
        title="Sponsorfeest"
        href="/event/1"
        variant="featured"
        countdown="over 33 dagen"
      />,
    );
    expect(screen.getByText("over 33 dagen")).toBeInTheDocument();
  });

  it("renders ExternalLink indicator when isExternal=true and href is set", () => {
    render(
      <NewsCard
        title="Sponsorfeest"
        href="https://facebook.com/event"
        variant="featured"
        isExternal
      />,
    );
    // ExternalLink icon is aria-hidden, verify the link has target="_blank"
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders as non-interactive div when no href", () => {
    render(<NewsCard title="Sponsorfeest" variant="featured" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
```

Note: `NewsCard` currently always has `href: string` (required). The last test requires making `href` optional. Update the prop type first (Step 3).

**Step 2: Run tests to confirm failure**

```bash
pnpm --filter @kcvv/web test src/components/home/LatestNews/NewsCard.test.tsx
```

**Step 3: Update `NewsCard` props**

```typescript
export interface NewsCardProps {
  title: string;
  href?: string; // now optional — cards without href are non-interactive
  imageUrl?: string;
  imageAlt?: string;
  badge?: string;
  date?: string;
  /** ISO datetime or formatted string for event date (shown with Calendar icon) */
  eventDate?: string;
  /** HH:MM time string for events (shown with Clock icon) */
  eventTime?: string;
  /** Countdown label shown in footer chip (e.g. "over 33 dagen") */
  countdown?: string;
  /** When true, full-card link opens in new tab with ExternalLink indicator */
  isExternal?: boolean;
  variant?: "standard" | "featured";
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
}
```

**Step 4: Update rendering in `NewsCard`**

Import icons:

```typescript
import { Calendar, Clock, ExternalLink } from "@/lib/icons";
```

Update the full-card link to support external:

```tsx
{
  href && (
    <Link
      href={href}
      className="absolute inset-0 z-10"
      aria-label={title}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    />
  );
}
```

Remove hover effect when no href:

```typescript
"transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
```

becomes:

```typescript
href && "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
```

Similarly, the green top-border animation should be conditional:

```tsx
{
  href && (
    <div
      className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
      aria-hidden="true"
    />
  );
}
```

Replace the bottom content overlay's date/badge footer with event-aware rendering:

```tsx
{
  /* Footer bar: countdown chip OR date+badge */
}
{
  (countdown ?? date ?? badge) && (
    <div className="border-t border-white/20 mt-3 pt-3 text-white/60 text-xs flex justify-between items-center">
      <div className="flex items-center gap-3">
        {(eventDate ?? date) && !countdown && (
          <time className="flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" aria-hidden />
            {eventDate ?? date}
          </time>
        )}
        {eventTime && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" aria-hidden />
            {eventTime}
          </span>
        )}
        {!eventDate && !eventTime && date && <time>{date}</time>}
        {badge && !eventDate && !eventTime && <span>{badge}</span>}
      </div>
      {countdown && (
        <span className="text-xs uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-sm font-medium text-white/70">
          {countdown}
        </span>
      )}
      {isExternal && !countdown && (
        <ExternalLink
          className="w-3 h-3 flex-shrink-0 text-white/40"
          aria-hidden
        />
      )}
    </div>
  );
}
```

**Step 5: Update `FeaturedEventStub` in `LatestNews.tsx`**

Add `time?: string`, `countdown?: string`, `isExternal?: boolean` to `FeaturedEventStub` and pass them through to `NewsCard`:

```typescript
export interface FeaturedEventStub {
  title: string;
  href?: string;
  imageUrl?: string;
  imageAlt?: string;
  badge?: string;
  date?: string;
  time?: string;
  countdown?: string;
  isExternal?: boolean;
}
```

In `LatestNews` JSX:

```tsx
<NewsCard
  variant="featured"
  title={featuredEvent.title}
  href={featuredEvent.href}
  imageUrl={featuredEvent.imageUrl}
  imageAlt={featuredEvent.imageAlt}
  badge={featuredEvent.badge ?? "EVENEMENT"}
  eventDate={featuredEvent.date}
  eventTime={featuredEvent.time}
  countdown={featuredEvent.countdown}
  isExternal={featuredEvent.isExternal}
/>
```

**Step 6: Run tests**

```bash
pnpm --filter @kcvv/web test src/components/home/LatestNews/
```

Expected: all PASS.

**Step 7: Update Storybook stories**

Add to `NewsCard.stories.tsx`:

```typescript
export const FeaturedEvent: Story = {
  args: {
    variant: "featured",
    title: "Sponsorfeest KCVV Elewijt 2026",
    href: "https://facebook.com/event",
    badge: "EVENEMENT",
    eventDate: "26 apr",
    eventTime: "19:00",
    countdown: "over 33 dagen",
    isExternal: true,
    imageUrl: "...",
  },
};

export const FeaturedEventNoImage: Story = {
  args: {
    variant: "featured",
    title: "Sponsorfeest KCVV Elewijt 2026",
    badge: "EVENEMENT",
    eventDate: "26 apr",
    eventTime: "19:00",
    countdown: "over 33 dagen",
  },
};
```

**Step 8: Commit**

```bash
git add apps/web/src/components/home/LatestNews/
git commit -m "feat(ui): NewsCard — event card enhancements (icons, countdown, external link)"
```

---

### Task 5: BannerSlot component

**Files:**

- Create: `apps/web/src/components/home/BannerSlot/BannerSlot.tsx`
- Create: `apps/web/src/components/home/BannerSlot/index.ts`
- Create: `apps/web/src/components/home/BannerSlot/BannerSlot.stories.tsx`
- Modify: `apps/web/src/components/home/index.ts`

No unit tests needed — purely presentational, no logic.

**Step 1: Create `BannerSlot.tsx`**

```typescript
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface BannerSlotProps {
  /** Banner image URL */
  image: string;
  /** Alt text for accessibility */
  alt: string;
  /** Optional click-through URL — wraps in <a> when set */
  href?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Optional editorial/campaign banner.
 * Contained (not full-bleed), rounded corners, subtle shadow.
 * Hidden when no banner is configured (call site handles conditional rendering).
 */
export const BannerSlot = ({ image, alt, href, className }: BannerSlotProps) => {
  const inner = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded shadow-sm",
        "aspect-[6/1] min-h-[60px]",
        className,
      )}
    >
      <Image
        src={image}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 1280px"
        priority={false}
      />
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-7xl mx-auto px-4 md:px-8 py-8"
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">{inner}</div>
  );
};
```

**Step 2: Create `index.ts`**

```typescript
export { BannerSlot } from "./BannerSlot";
export type { BannerSlotProps } from "./BannerSlot";
```

**Step 3: Add export to `apps/web/src/components/home/index.ts`**

```typescript
export { BannerSlot } from "./BannerSlot";
export type { BannerSlotProps } from "./BannerSlot";
```

**Step 4: Create stories**

```typescript
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BannerSlot } from "./BannerSlot";

const meta = {
  title: "Features/Homepage/BannerSlot",
  component: BannerSlot,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BannerSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLink: Story = {
  args: {
    image: "/images/placeholder-banner.jpg",
    alt: "Anti-racism campaign",
    href: "https://example.com",
  },
};

export const NoLink: Story = {
  args: {
    image: "/images/placeholder-banner.jpg",
    alt: "Summer camp 2026",
  },
};
```

Note: placeholder image must exist. Use any existing image in `public/images/` for stories.

**Step 5: Commit**

```bash
git add apps/web/src/components/home/BannerSlot/
git add apps/web/src/components/home/index.ts
git commit -m "feat(ui): add BannerSlot component"
```

---

### Task 6: Sanity schema — `event.featuredOnHome`, `banner` document, `homePage` singleton

**Files:**

- Modify: `apps/studio/schemaTypes/event.ts`
- Create: `apps/studio/schemaTypes/banner.ts`
- Create: `apps/studio/schemaTypes/homePage.ts`
- Modify: `apps/studio/schemaTypes/index.ts`

**Step 1: Add `featuredOnHome` to event schema**

In `event.ts`, add inside `fields`:

```typescript
defineField({
  name: 'featuredOnHome',
  title: 'Featured on homepage',
  type: 'boolean',
  description: 'When enabled, this event fills the featured slot in the news section on the homepage.',
  initialValue: false,
}),
```

**Step 2: Create `banner.ts`**

```typescript
import { defineField, defineType } from "sanity";

export const banner = defineType({
  name: "banner",
  title: "Banner",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Banner image",
      type: "image",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      validation: (r) => r.required(),
      description: "Required for accessibility. Describe the banner content.",
    }),
    defineField({
      name: "href",
      title: "Click-through URL",
      type: "url",
      description: "Optional. Wraps the banner in a link.",
    }),
  ],
  preview: {
    select: { title: "alt", media: "image" },
  },
});
```

**Step 3: Create `homePage.ts`**

```typescript
import { defineField, defineType } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Homepage",
  type: "document",
  __experimental_actions: ["update", "publish"],
  fields: [
    defineField({
      name: "bannerSlotA",
      title: "Banner slot A (below Match Widget)",
      type: "reference",
      to: [{ type: "banner" }],
    }),
    defineField({
      name: "bannerSlotB",
      title: "Banner slot B (below News section)",
      type: "reference",
      to: [{ type: "banner" }],
    }),
    defineField({
      name: "bannerSlotC",
      title: "Banner slot C (below Youth section)",
      type: "reference",
      to: [{ type: "banner" }],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Homepage configuration" };
    },
  },
});
```

**Step 4: Register schemas**

In `apps/studio/schemaTypes/index.ts`:

```typescript
import { banner } from "./banner";
import { homePage } from "./homePage";

export const schemaTypes = [
  player,
  team,
  trainingDay,
  staffMember,
  responsibilityPath,
  article,
  sponsor,
  event,
  page,
  fileAttachment,
  htmlTable,
  banner,
  homePage,
];
```

**Step 5: Commit**

```bash
git add apps/studio/schemaTypes/
git commit -m "feat(schema): add banner document, homePage singleton, event.featuredOnHome"
```

---

### Task 7: SanityService — `getNextFeaturedEvent` + `getHomepageBanners`

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/events.ts`
- Create: `apps/web/src/lib/sanity/queries/homePage.ts`
- Modify: `apps/web/src/lib/effect/services/SanityService.ts`
- Modify: `apps/web/src/lib/effect/services/SanityService.test.ts`

**Step 1: Write failing service tests**

In `SanityService.test.ts`, look at the existing test pattern (mocking `sanityClient.fetch`) and add:

```typescript
describe("getNextFeaturedEvent", () => {
  it("returns the next event with featuredOnHome=true when present", async () => {
    const mockEvent = {
      _id: "event-1",
      title: "Sponsorfeest",
      dateStart: "2026-04-26T19:00:00.000Z",
      dateEnd: null,
      externalLink: { url: "https://fb.com", label: "Facebook" },
      coverImageUrl: "https://cdn.sanity.io/img.jpg",
      featuredOnHome: true,
    };
    vi.mocked(sanityClient.fetch).mockResolvedValueOnce(mockEvent);
    const result = await runPromise(
      Effect.flatMap(SanityService, (s) => s.getNextFeaturedEvent()),
    );
    expect(result).not.toBeNull();
    expect(result?._id).toBe("event-1");
  });

  it("returns null when no upcoming events exist", async () => {
    vi.mocked(sanityClient.fetch).mockResolvedValueOnce(null);
    const result = await runPromise(
      Effect.flatMap(SanityService, (s) => s.getNextFeaturedEvent()),
    );
    expect(result).toBeNull();
  });
});

describe("getHomepageBanners", () => {
  it("returns resolved banner data from homepage singleton", async () => {
    vi.mocked(sanityClient.fetch).mockResolvedValueOnce({
      bannerSlotA: {
        _id: "b1",
        imageUrl: "/img.jpg",
        alt: "Anti-racism",
        href: null,
      },
      bannerSlotB: null,
      bannerSlotC: null,
    });
    const result = await runPromise(
      Effect.flatMap(SanityService, (s) => s.getHomepageBanners()),
    );
    expect(result.bannerSlotA).not.toBeNull();
    expect(result.bannerSlotB).toBeNull();
  });
});
```

**Step 2: Run to confirm failure**

```bash
pnpm --filter @kcvv/web test src/lib/effect/services/SanityService.test.ts
```

**Step 3: Add query to `events.ts`**

```typescript
// Returns the next event with featuredOnHome=true, or the earliest upcoming event,
// or null if none exist. $now must be current ISO datetime.
export const NEXT_FEATURED_EVENT_QUERY = `
  coalesce(
    *[_type == "event" && featuredOnHome == true && dateStart > $now] | order(dateStart asc) [0] {
      _id, title, dateStart, dateEnd, featuredOnHome, externalLink,
      "coverImageUrl": coverImage.asset->url
    },
    *[_type == "event" && dateStart > $now] | order(dateStart asc) [0] {
      _id, title, dateStart, dateEnd, featuredOnHome, externalLink,
      "coverImageUrl": coverImage.asset->url
    }
  )
`;
```

**Step 4: Create `homePage.ts` query file**

```typescript
export const HOMEPAGE_BANNERS_QUERY = `
  *[_type == "homePage"][0] {
    "bannerSlotA": bannerSlotA-> {
      _id,
      "imageUrl": image.asset->url,
      alt,
      href
    },
    "bannerSlotB": bannerSlotB-> {
      _id,
      "imageUrl": image.asset->url,
      alt,
      href
    },
    "bannerSlotC": bannerSlotC-> {
      _id,
      "imageUrl": image.asset->url,
      alt,
      href
    }
  }
`;
```

**Step 5: Add types and methods to `SanityService.ts`**

Add new types:

```typescript
export interface SanityBannerSlot {
  _id: string;
  imageUrl: string;
  alt: string;
  href: string | null;
}

export interface SanityHomepageBanners {
  bannerSlotA: SanityBannerSlot | null;
  bannerSlotB: SanityBannerSlot | null;
  bannerSlotC: SanityBannerSlot | null;
}

// Update SanityEvent to include featuredOnHome:
export interface SanityEvent {
  _id: string;
  title: string;
  dateStart: string;
  dateEnd: string | null;
  externalLink: { url: string; label: string } | null;
  coverImageUrl: string | null;
  featuredOnHome?: boolean;
}
```

Add to `SanityServiceInterface`:

```typescript
readonly getNextFeaturedEvent: () => Effect.Effect<SanityEvent | null>;
readonly getHomepageBanners: () => Effect.Effect<SanityHomepageBanners>;
```

Add to `SanityServiceLive`:

```typescript
getNextFeaturedEvent: () =>
  fetchGroq<SanityEvent | null>(NEXT_FEATURED_EVENT_QUERY, {
    now: new Date().toISOString(),
  }),
getHomepageBanners: () =>
  fetchGroq<SanityHomepageBanners | null>(HOMEPAGE_BANNERS_QUERY).pipe(
    Effect.map((data) => data ?? { bannerSlotA: null, bannerSlotB: null, bannerSlotC: null }),
  ),
```

Import the new queries at the top of `SanityService.ts`.

**Step 6: Run tests**

```bash
pnpm --filter @kcvv/web test src/lib/effect/services/SanityService.test.ts
```

Expected: all PASS.

**Step 7: Commit**

```bash
git add apps/web/src/lib/sanity/queries/ apps/web/src/lib/effect/services/SanityService.ts apps/web/src/lib/effect/services/SanityService.test.ts
git commit -m "feat(schema): SanityService — getNextFeaturedEvent + getHomepageBanners"
```

---

### Task 8: MatchesSlider section wrapper — homepage dark section

The `MatchesSlider` component itself is a flat row. The homepage needs it wrapped in a `py-20` dark section with `SectionHeader`, diagonal top cut, and a "Wedstrijden" title + `/calendar` link. Create a thin wrapper component.

**Files:**

- Create: `apps/web/src/components/home/MatchesSliderSection/MatchesSliderSection.tsx`
- Create: `apps/web/src/components/home/MatchesSliderSection/index.ts`
- Create: `apps/web/src/components/home/MatchesSliderSection/MatchesSliderSection.stories.tsx`
- Modify: `apps/web/src/components/home/index.ts`

No unit tests — presentational wrapper with no logic.

**Step 1: Create `MatchesSliderSection.tsx`**

```typescript
import Link from "next/link";
import { MatchesSlider } from "@/components/match/MatchesSlider/MatchesSlider";
import type { UpcomingMatch } from "@/components/match/types";
import { cn } from "@/lib/utils/cn";

export interface MatchesSliderSectionProps {
  matches: UpcomingMatch[];
  highlightTeamId?: number;
  className?: string;
}

export const MatchesSliderSection = ({
  matches,
  highlightTeamId,
  className,
}: MatchesSliderSectionProps) => {
  if (matches.length === 0) return null;

  return (
    <section
      className={cn(
        "relative bg-kcvv-black py-20",
        // Diagonal top cut: gray-100 → kcvv-black
        "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0",
        "before:h-8 before:bg-gray-100 before:[clip-path:polygon(0_0,100%_0,100%_100%,0_0)]",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-kcvv-green pl-3">
            Wedstrijden
          </h2>
          <Link
            href="/calendar"
            className="text-sm text-kcvv-green hover:text-white transition-colors font-medium"
          >
            Alle wedstrijden →
          </Link>
        </div>

        <MatchesSlider
          matches={matches}
          highlightTeamId={highlightTeamId}
          theme="dark"
        />
      </div>
    </section>
  );
};
```

Note on diagonal implementation: the CSS `clip-path` approach for diagonals should match the existing pattern in the codebase. Check how `MatchWidget` or `FeaturedArticles` implement diagonal cuts — replicate the exact same technique. If they use a different method (e.g. `skewY`, SVG, `polygon()`), use that method here for visual consistency.

**Step 2: Create barrel + export**

`index.ts`:

```typescript
export { MatchesSliderSection } from "./MatchesSliderSection";
export type { MatchesSliderSectionProps } from "./MatchesSliderSection";
```

Add to `apps/web/src/components/home/index.ts`.

**Step 3: Stories**

```typescript
export const Default: Story = {
  args: {
    matches: mockMatches.mixed.map((m, i) => ({
      ...m,
      teamLabel: i < 3 ? "A-Ploeg" : "U17",
    })),
  },
  parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
};
```

**Step 4: Commit**

```bash
git add apps/web/src/components/home/MatchesSliderSection/
git add apps/web/src/components/home/index.ts
git commit -m "feat(ui): add MatchesSliderSection homepage block"
```

---

### Task 9: YouthSection homepage block

**Files:**

- Create: `apps/web/src/components/home/YouthSection/YouthSection.tsx`
- Create: `apps/web/src/components/home/YouthSection/index.ts`
- Create: `apps/web/src/components/home/YouthSection/YouthSection.stories.tsx`
- Modify: `apps/web/src/components/home/index.ts`

Before implementing, run:

```bash
ls apps/web/public/images/ | grep -i jersey
ls apps/web/public/images/ | grep -i youth
```

Confirm the jersey/youth image filename. The design doc says "confirm filename in `public/images/`". Use whatever file exists. If none exists yet, use a placeholder path and note it with a `TODO:` comment.

**Step 1: Create `YouthSection.tsx`**

```typescript
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface YouthSectionProps {
  className?: string;
}

export const YouthSection = ({ className }: YouthSectionProps) => {
  return (
    <section
      className={cn(
        "relative bg-kcvv-green-dark py-20 text-center overflow-hidden",
        // Diagonal top cut from kcvv-black
        "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0",
        "before:h-8 before:bg-kcvv-black before:[clip-path:polygon(0_0,100%_0,100%_100%,0_0)]",
        // Diagonal bottom cut to gray-100
        "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0",
        "after:h-8 after:bg-gray-100 after:[clip-path:polygon(0_100%,100%_0,100%_100%,0_100%)]",
        className,
      )}
    >
      <div className="relative max-w-3xl mx-auto px-4 md:px-8">
        {/* Section label */}
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50 mb-6">
          Jeugd
        </p>

        {/* Stat row */}
        <div className="flex items-center justify-center gap-8 md:gap-16 mb-10">
          <div>
            <div
              className="font-display font-black text-kcvv-green leading-none"
              style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
            >
              220+
            </div>
            <div className="text-xs tracking-widest uppercase text-white/50 mt-1">
              Spelers
            </div>
          </div>
          <div className="w-px h-16 bg-white/15" aria-hidden="true" />
          <div>
            <div
              className="font-display font-black text-kcvv-green leading-none"
              style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
            >
              16
            </div>
            <div className="text-xs tracking-widest uppercase text-white/50 mt-1">
              Ploegen
            </div>
          </div>
        </div>

        {/* Jersey photo */}
        {/* TODO: confirm jersey image path in public/images/ */}
        <div className="relative inline-block mb-10">
          <Image
            src="/images/youth-jerseys.png"
            alt="KCVV jeugd tenues"
            width={480}
            height={360}
            className="max-w-sm w-full mx-auto object-contain drop-shadow-xl"
            style={{ rotate: "1deg" }}
          />
        </div>

        {/* CTA */}
        <div>
          <Link
            href="/jeugd"
            className="inline-flex items-center gap-2 px-6 py-3 bg-kcvv-green text-kcvv-black font-bold text-sm uppercase tracking-wider rounded-sm hover:bg-kcvv-green/90 transition-colors"
          >
            Ontdek onze jeugd
          </Link>
        </div>
      </div>
    </section>
  );
};
```

Check the `font-display` class — verify it maps to the stenciletta/quasimoda font in `globals.css`. If not, use `font-bold` with Tailwind's default.

**Step 2: Barrel + export + stories — same pattern as BannerSlot task.**

**Step 3: Commit**

```bash
git add apps/web/src/components/home/YouthSection/
git add apps/web/src/components/home/index.ts
git commit -m "feat(ui): add YouthSection homepage block"
```

---

### Task 10: SponsorsSection — homepage light-section wrapper

**Goal:** Wrap `SponsorsBlock` in a `py-20 bg-gray-100` section with a v3-style `SectionHeader` (green left border, "Word sponsor →" link).

The existing `Sponsors` component uses its own internal header. For the homepage, we need the standard `SectionHeader` component. Create a thin section wrapper.

**Files:**

- Create: `apps/web/src/components/home/SponsorsSection/SponsorsSection.tsx`
- Create: `apps/web/src/components/home/SponsorsSection/index.ts`
- Create: `apps/web/src/components/home/SponsorsSection/SponsorsSection.stories.tsx`
- Modify: `apps/web/src/components/home/index.ts`

**Step 1: Create `SponsorsSection.tsx`**

This is a server component (async) because it fetches sponsors.

```typescript
import { cn } from "@/lib/utils/cn";
import { SectionHeader } from "@/components/design-system";
import { SponsorsBlock } from "@/components/sponsors";

export interface SponsorsSectionProps {
  className?: string;
}

export async function SponsorsSection({ className }: SponsorsSectionProps) {
  return (
    <section className={cn("bg-gray-100 py-20", className)}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader
          title="Sponsors"
          linkText="Word sponsor"
          linkHref="/sponsors"
        />
        <SponsorsBlock
          title=""
          description=""
          showViewAll={false}
          variant="light"
          columns={5}
          className="py-0"
        />
      </div>
    </section>
  );
}
```

Note: the `Sponsors` component already has `grayscale` + opacity hover on logos in light variant. Verify the hover treatment matches the design (opacity-50 default → opacity-100 hover). If it doesn't, update `Sponsors.tsx` at this step.

**Step 2: Barrel + exports + stories (use `Sponsors.mocks.ts` for story data).**

**Step 3: Commit**

```bash
git add apps/web/src/components/home/SponsorsSection/
git add apps/web/src/components/home/index.ts
git commit -m "feat(ui): add SponsorsSection homepage block"
```

---

### Task 11: PageFooter redesign

**Goal:** Replace the current footer (SVG wavy, contact table, sponsors) with the v3 design: simplified 3-column grid, brand column, 2 link columns, copyright bar.

**Files:**

- Modify: `apps/web/src/components/layout/PageFooter/PageFooter.tsx`
- Modify: `apps/web/src/components/layout/PageFooter/PageFooter.test.tsx`
- Modify: `apps/web/src/components/layout/PageFooter/PageFooter.stories.tsx`

**Step 1: Read and understand existing footer tests before changing**

```bash
cat apps/web/src/components/layout/PageFooter/PageFooter.test.tsx
```

Update tests to match new structure before implementing (TDD).

**Step 2: Write updated failing tests**

Replace tests with expectations matching the new design:

```typescript
it("renders KCVV logo", () => {
  render(<PageFooter />);
  const logo = screen.getByAltText(/KCVV/i);
  expect(logo).toBeInTheDocument();
});

it("renders club address", () => {
  render(<PageFooter />);
  expect(screen.getByText(/Driesstraat 32/)).toBeInTheDocument();
});

it("renders club email", () => {
  render(<PageFooter />);
  expect(screen.getByText("info@kcvvelewijt.be")).toBeInTheDocument();
});

it("renders Facebook link", () => {
  render(<PageFooter />);
  const fbLink = screen.getByRole("link", { name: /facebook/i });
  expect(fbLink).toBeInTheDocument();
});

it("renders Instagram link", () => {
  render(<PageFooter />);
  const igLink = screen.getByRole("link", { name: /instagram/i });
  expect(igLink).toBeInTheDocument();
});

it("renders copyright text", () => {
  render(<PageFooter />);
  expect(screen.getByText(/KCVV Elewijt/)).toBeInTheDocument();
});

it("renders privacy policy link", () => {
  render(<PageFooter />);
  const privacyLink = screen.getByRole("link", { name: /privacy/i });
  expect(privacyLink).toHaveAttribute("href", "/privacy");
});
```

**Step 3: Run tests to confirm failure**

```bash
pnpm --filter @kcvv/web test src/components/layout/PageFooter/PageFooter.test.tsx
```

**Step 4: Rewrite `PageFooter.tsx`**

Remove the SVG wavy bg, the contact table rows, the SocialLinks component import, the SponsorsBlock import. Replace with:

```tsx
import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Facebook, Instagram } from "@/lib/icons";
import { CookiePreferencesButton } from "./CookiePreferencesButton";
import { cn } from "@/lib/utils/cn";

export const PageFooter = ({ className }: PageFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "bg-kcvv-black border-t border-white/6 text-white",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-12">
          {/* Brand column */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo-flat.png"
                alt="KCVV Elewijt"
                width={120}
                height={48}
                className="h-14 w-auto"
              />
            </Link>
            <p className="font-bold text-white text-sm mb-0.5">
              K.C.V.V. Elewijt
            </p>
            <p className="text-white/30 text-xs mb-6">Opgericht in 1964</p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden />
                <span>Driesstraat 32, 1982 Elewijt</span>
              </div>
              <a
                href="mailto:info@kcvvelewijt.be"
                className="flex items-center gap-2 text-white/50 text-sm hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0" aria-hidden />
                <span>info@kcvvelewijt.be</span>
              </a>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/KCVVElewijt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KCVV Elewijt op Facebook"
                className="text-white/30 hover:text-kcvv-green transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/kcvv_elewijt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KCVV Elewijt op Instagram"
                className="text-white/30 hover:text-kcvv-green transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Link column 1 — Club */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
              Club
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/club/organigram", label: "Bestuur" },
                { href: "/sponsors", label: "Sponsors" },
                { href: "/privacy", label: "Privacy" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Link column 2 — Website */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
              Website
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/news", label: "Nieuws" },
                { href: "/calendar", label: "Kalender" },
                { href: "/jeugd", label: "Jeugd" },
                { href: "/hulp", label: "Hulp" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/6">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/25 text-xs">
            © {currentYear} K.C.V.V. Elewijt
          </p>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <Link
              href="/privacy"
              className="hover:text-white/50 transition-colors"
            >
              Privacyverklaring
            </Link>
            <CookiePreferencesButton />
          </div>
        </div>
      </div>
    </footer>
  );
};
```

Note: Facebook and Instagram URLs above are guesses. Verify the correct URLs from the existing `SocialLinks` component or Gatsby source before committing.

**Step 5: Run tests**

```bash
pnpm --filter @kcvv/web test src/components/layout/PageFooter/PageFooter.test.tsx
```

**Step 6: Update stories in `PageFooter.stories.tsx`**

**Step 7: Commit**

```bash
git add apps/web/src/components/layout/PageFooter/
git commit -m "feat(ui): redesign PageFooter — simplified grid, brand column, copyright bar"
```

---

### Task 12: Wire homepage `page.tsx`

**Goal:** Update the homepage to fetch all new data and render all new blocks in the correct order with diagonal cuts composing correctly when banner slots are absent.

**Files:**

- Modify: `apps/web/src/app/page.tsx`

**Step 1: Read the current `page.tsx` and understand the existing data flow**

Already done. Current fetches: articles + next matches.

**Step 2: Update `page.tsx`**

Add parallel fetches for `nextFeaturedEvent` and `banners`. Add `teamLabel` mapping to matches. Render all new sections.

```typescript
import {
  FeaturedArticles,
  LatestNews,
  MatchWidget,
  BannerSlot,
  MatchesSliderSection,
  YouthSection,
  SponsorsSection,
} from "@/components/home";
import { PageFooter } from "@/components/layout/PageFooter";
import { DateTime } from "luxon";

// Inside the component, add to Promise.all:
const [articlesResult, matchesResult, eventResult, bannersResult] =
  await Promise.all([
    // ... existing article fetch
    // ... existing match fetch
    runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        return yield* sanity.getNextFeaturedEvent();
      }).pipe(Effect.catchAll(() => Effect.succeed(null))),
    ),
    runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        return yield* sanity.getHomepageBanners();
      }).pipe(
        Effect.catchAll(() =>
          Effect.succeed({
            bannerSlotA: null,
            bannerSlotB: null,
            bannerSlotC: null,
          }),
        ),
      ),
    ),
  ]);
```

Build the featured event stub when event data is available:

```typescript
const featuredEvent = eventResult
  ? buildFeaturedEventStub(eventResult)
  : undefined;
```

Add a helper `buildFeaturedEventStub`:

```typescript
function buildFeaturedEventStub(event: SanityEvent): FeaturedEventStub {
  const dt = DateTime.fromISO(event.dateStart).setLocale("nl");
  const now = DateTime.now();
  const diffDays = Math.ceil(dt.diff(now, "days").days);
  const countdown =
    diffDays > 0
      ? `over ${diffDays} ${diffDays === 1 ? "dag" : "dagen"}`
      : undefined;

  return {
    title: event.title,
    href: event.externalLink?.url,
    imageUrl: event.coverImageUrl ?? undefined,
    badge: "EVENEMENT",
    date: dt.toFormat("d MMM"),
    time: dt.toFormat("HH:mm"),
    countdown,
    isExternal: !!event.externalLink?.url,
  };
}
```

Add `teamLabel` to matches for the slider. A-team ID is `1235` (from existing usage), B-team mapping TBD (check Sanity teams or BFF — use `TODO:` comment for now):

```typescript
// Build slider matches with team labels
// TODO: load team label map from Sanity teams to avoid hardcoding team IDs
const TEAM_LABELS: Record<number, string> = {
  1235: "A-Ploeg",
  // Add B-ploeg ID once confirmed
};

const sliderMatches = upcomingMatches.map((m) => ({
  ...m,
  teamLabel:
    TEAM_LABELS[m.homeTeam.id] ?? TEAM_LABELS[m.awayTeam.id] ?? undefined,
}));
```

Render the full section stack:

```tsx
return (
  <>
    {/* Hero */}
    {featuredArticles.length > 0 && <FeaturedArticles ... />}

    {/* Match Widget — A-team next match */}
    {nextMatch && <MatchWidget match={nextMatch} teamLabel="A-Ploeg" />}

    {/* Banner slot A — below match widget */}
    {banners.bannerSlotA && (
      <BannerSlot
        image={banners.bannerSlotA.imageUrl}
        alt={banners.bannerSlotA.alt}
        href={banners.bannerSlotA.href ?? undefined}
      />
    )}

    {/* News section */}
    {(latestNewsArticles.length > 0 || featuredEvent) && (
      <LatestNews
        articles={latestNewsArticles}
        featuredEvent={featuredEvent}
        title="Laatste nieuws"
        showViewAll
        viewAllHref="/news"
      />
    )}

    {/* Banner slot B — below news */}
    {banners.bannerSlotB && (
      <BannerSlot
        image={banners.bannerSlotB.imageUrl}
        alt={banners.bannerSlotB.alt}
        href={banners.bannerSlotB.href ?? undefined}
      />
    )}

    {/* Match slider */}
    <MatchesSliderSection
      matches={sliderMatches}
      highlightTeamId={1235}
    />

    {/* Youth section */}
    <YouthSection />

    {/* Banner slot C — below youth */}
    {banners.bannerSlotC && (
      <BannerSlot
        image={banners.bannerSlotC.imageUrl}
        alt={banners.bannerSlotC.alt}
        href={banners.bannerSlotC.href ?? undefined}
      />
    )}

    {/* Sponsors */}
    <SponsorsSection />
  </>
);
```

**Step 3: Run type-check and lint**

```bash
pnpm --filter @kcvv/web lint:fix
pnpm --filter @kcvv/web type-check
```

Fix all errors before committing.

**Step 4: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(ui): wire homepage v3 — all new blocks, shared match fetch, event stub"
```

---

### Task 13: Full check + type-check before PR

**Step 1: Run full check**

```bash
pnpm --filter @kcvv/web check-all
```

Fix any remaining lint/type/test failures.

**Step 2: Run build to catch Turbopack issues**

```bash
pnpm turbo build --filter=@kcvv/web
```

**Step 3: Visual smoke test**

Start dev server and verify each homepage section visually:

```bash
pnpm --filter @kcvv/web dev
```

Check:

- Hero carousel loads
- Match widget shows A-team next match
- Banner slot A: hidden when no Sanity data (expected in local dev)
- News section: event card variant if upcoming event exists in Sanity, else first article is featured
- Banner slot B: hidden
- Match slider: dark theme, team labels, scrollable
- Youth section: stats + CTA visible, jersey photo (verify file exists)
- Banner slot C: hidden
- Sponsors section: gray-100 bg, logo grid
- Footer: new layout, contact info, social icons, copyright bar

**Step 4: Final commit if any fixes**

```bash
git add -p  # stage specific changes only
git commit -m "fix(ui): homepage v3 smoke test fixes"
```

---

### Task 14: Push + PR

```bash
git push -u origin feat/homepage-v3
```

Then ask the user whether to open a PR.
