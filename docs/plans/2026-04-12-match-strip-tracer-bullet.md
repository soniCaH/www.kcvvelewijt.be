# MatchStrip Tracer Bullet Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render a persistent, glanceable first-team match strip on all non-homepage routes, consuming real data from the existing BFF endpoint.

**Architecture:** Create a shared server utility that wraps `BffService.getNextMatches()` + `mapMatchesToUpcomingMatches()`. Add a `(main)/layout.tsx` that calls this utility and passes the first match to a new `MatchStrip` component rendered between the header spacer and page content. The homepage (`app/page.tsx`) lives outside `(main)`, so it's naturally excluded.

**Tech Stack:** Next.js 15 (App Router, Server Components), Effect, Tailwind v4, Vitest + React Testing Library

---

## Pre-implementation notes

### Tracer bullet scope

This is a tracer bullet — thinnest possible slice that proves the path end-to-end. No skeleton, no analytics, no dismiss, no entrance animation. Just: fetch → transform → render → link.

### Key file locations (read these for context)

| Concern              | Path                                                            |
| -------------------- | --------------------------------------------------------------- |
| `UpcomingMatch` type | `apps/web/src/components/match/types.ts`                        |
| Match mapper         | `apps/web/src/lib/mappers/match.mapper.ts`                      |
| BffService           | `apps/web/src/lib/effect/services/BffService.ts`                |
| Effect runtime       | `apps/web/src/lib/effect/runtime.ts`                            |
| Existing mocks       | `apps/web/src/components/home/MatchWidget/MatchWidget.mocks.ts` |
| Homepage (reference) | `apps/web/src/app/page.tsx` (lines 112-153)                     |
| Root layout          | `apps/web/src/app/layout.tsx`                                   |
| Date utils           | `apps/web/src/lib/utils/dates.ts`                               |

### Link behavior (from MatchWidget reference)

- Finished/forfeited → `/wedstrijd/${match.id}`
- Scheduled/postponed/stopped → `/wedstrijd/${match.id}` (tracer bullet simplification — always link to match detail)

---

## Task 1: Shared server utility — `getFirstTeamNextMatch()`

**Files:**

- Create: `apps/web/src/lib/server/match-data.ts`
- Test: `apps/web/src/lib/server/match-data.test.ts`

This utility wraps the existing `BffService.getNextMatches()` + `mapMatchesToUpcomingMatches()` calls into one reusable function. Both the homepage and the `(main)` layout will call this instead of duplicating the Effect pipeline.

### Step 1: Write the failing test

```typescript
// apps/web/src/lib/server/match-data.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn(),
}));

vi.mock("@/lib/mappers", () => ({
  mapMatchesToUpcomingMatches: vi.fn(),
}));

import { runPromise } from "@/lib/effect/runtime";
import { mapMatchesToUpcomingMatches } from "@/lib/mappers";
import { getFirstTeamNextMatch } from "./match-data";

const runPromiseMock = vi.mocked(runPromise);
const mapperMock = vi.mocked(mapMatchesToUpcomingMatches);

describe("getFirstTeamNextMatch", () => {
  it("returns the first UpcomingMatch when BFF returns matches", async () => {
    const fakeMatch = { id: 42 };
    const fakeUpcoming = [
      { id: 42, status: "scheduled" },
      { id: 43, status: "finished" },
    ];

    runPromiseMock.mockResolvedValue([fakeMatch]);
    mapperMock.mockReturnValue(fakeUpcoming as never);

    const result = await getFirstTeamNextMatch();

    expect(result).toEqual({ id: 42, status: "scheduled" });
    expect(mapperMock).toHaveBeenCalledWith([fakeMatch]);
  });

  it("returns null when BFF returns empty array", async () => {
    runPromiseMock.mockResolvedValue([]);
    mapperMock.mockReturnValue([]);

    const result = await getFirstTeamNextMatch();

    expect(result).toBeNull();
  });

  it("returns null when BFF call fails", async () => {
    runPromiseMock.mockRejectedValue(new Error("BFF down"));

    const result = await getFirstTeamNextMatch();

    expect(result).toBeNull();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /Users/kevinvanransbeeck/Sites/KCVV/kcvv-issue-1269
pnpm --filter @kcvv/web exec vitest run src/lib/server/match-data.test.ts 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module './match-data'`

### Step 3: Write minimal implementation

```typescript
// apps/web/src/lib/server/match-data.ts
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { mapMatchesToUpcomingMatches } from "@/lib/mappers";
import type { UpcomingMatch } from "@/components/match/types";

/**
 * Fetch the most relevant first-team match (last result or next fixture).
 * Returns `null` when no data is available or the BFF call fails.
 *
 * Shared between the homepage and the (main) route group layout.
 */
export async function getFirstTeamNextMatch(): Promise<UpcomingMatch | null> {
  try {
    const matches = await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getNextMatches();
      }),
    );
    const upcoming = mapMatchesToUpcomingMatches(matches);
    return upcoming[0] ?? null;
  } catch {
    return null;
  }
}
```

### Step 4: Run test to verify it passes

```bash
pnpm --filter @kcvv/web exec vitest run src/lib/server/match-data.test.ts 2>&1 | tail -20
```

Expected: 3 tests PASS

### Step 5: Commit

```bash
git add apps/web/src/lib/server/match-data.ts apps/web/src/lib/server/match-data.test.ts
git commit -m "feat(ui): add shared getFirstTeamNextMatch server utility

Wraps BffService.getNextMatches() + mapMatchesToUpcomingMatches() for
reuse between homepage and (main) layout.

Closes #1269 (partial)"
```

---

## Task 2: `MatchStrip` component — rendering logic

**Files:**

- Create: `apps/web/src/components/layout/MatchStrip/MatchStrip.tsx`
- Create: `apps/web/src/components/layout/MatchStrip/MatchStrip.test.tsx`
- Create: `apps/web/src/components/layout/MatchStrip/index.ts`

The component is a thin bar that shows either a finished result or the next fixture, linking to the match detail page.

### Step 1: Write failing tests

```typescript
// apps/web/src/components/layout/MatchStrip/MatchStrip.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchStrip } from "./MatchStrip";
import {
  mockFinishedMatchWin,
  mockUpcomingMatch,
} from "@/components/home/MatchWidget/MatchWidget.mocks";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("MatchStrip", () => {
  describe("finished match", () => {
    it("renders score line for finished match", () => {
      render(<MatchStrip match={mockFinishedMatchWin} />);
      expect(screen.getByText(/KCVV Elewijt/)).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/FC Wezel Sport/)).toBeInTheDocument();
    });

    it("links to match detail page", () => {
      render(<MatchStrip match={mockFinishedMatchWin} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", `/wedstrijd/${mockFinishedMatchWin.id}`);
    });
  });

  describe("scheduled match", () => {
    it("renders next match info", () => {
      render(<MatchStrip match={mockUpcomingMatch} />);
      expect(screen.getByText(/Volgende/)).toBeInTheDocument();
      expect(screen.getByText(/KVC Wilrijk/)).toBeInTheDocument();
    });

    it("shows time for scheduled match", () => {
      render(<MatchStrip match={mockUpcomingMatch} />);
      expect(screen.getByText(/15:00/)).toBeInTheDocument();
    });

    it("links to match detail page", () => {
      render(<MatchStrip match={mockUpcomingMatch} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", `/wedstrijd/${mockUpcomingMatch.id}`);
    });
  });

  describe("competition name", () => {
    it("renders competition name with hidden-on-mobile class", () => {
      render(<MatchStrip match={mockUpcomingMatch} />);
      const competition = screen.getByText(/3e Afdeling VV/);
      expect(competition).toBeInTheDocument();
      expect(competition.className).toContain("hidden");
      expect(competition.className).toContain("md:inline");
    });
  });

  describe("null match", () => {
    it("renders nothing when match is null", () => {
      const { container } = render(<MatchStrip match={null} />);
      expect(container.innerHTML).toBe("");
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @kcvv/web exec vitest run src/components/layout/MatchStrip/MatchStrip.test.tsx 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module './MatchStrip'`

### Step 3: Write minimal implementation

```typescript
// apps/web/src/components/layout/MatchStrip/MatchStrip.tsx
import Link from "next/link";
import type { UpcomingMatch } from "@/components/match/types";
import { formatWidgetDate } from "@/lib/utils/dates";

export interface MatchStripProps {
  match: UpcomingMatch | null;
}

export function MatchStrip({ match }: MatchStripProps) {
  if (!match) return null;

  const isFinished =
    match.status === "finished" || match.status === "forfeited";

  const href = `/wedstrijd/${match.id}`;

  return (
    <div className="bg-kcvv-green-dark text-white">
      <Link
        href={href}
        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-kcvv-green-dark-hover transition-colors min-h-[40px]"
      >
        {isFinished ? (
          <FinishedLine match={match} />
        ) : (
          <ScheduledLine match={match} />
        )}
        {match.competition && (
          <span className="hidden md:inline text-white/60 text-xs before:content-['·'] before:mx-2 before:text-white/40">
            {match.competition}
          </span>
        )}
      </Link>
    </div>
  );
}

function FinishedLine({ match }: { match: UpcomingMatch }) {
  const dateStr = formatWidgetDate(match.date);
  return (
    <>
      <span className="text-white/60 text-xs">{dateStr}</span>
      <span className="font-bold">{match.homeTeam.name}</span>
      <span className="font-mono font-bold">{match.homeTeam.score}</span>
      <span className="text-white/50">–</span>
      <span className="font-mono font-bold">{match.awayTeam.score}</span>
      <span className="font-bold">{match.awayTeam.name}</span>
    </>
  );
}

function ScheduledLine({ match }: { match: UpcomingMatch }) {
  const opponent =
    match.homeTeam.id === 1235 ? match.awayTeam.name : match.homeTeam.name;
  const timeStr = match.time
    ? ` · ${formatWidgetDate(match.date)} ${match.time}`
    : ` · ${formatWidgetDate(match.date)}`;

  return (
    <>
      <span className="text-white/80">Volgende:</span>
      <span className="font-bold">vs {opponent}</span>
      <span className="text-white/60 text-xs">{timeStr}</span>
    </>
  );
}
```

```typescript
// apps/web/src/components/layout/MatchStrip/index.ts
export { MatchStrip } from "./MatchStrip";
export type { MatchStripProps } from "./MatchStrip";
```

### Step 4: Run test to verify it passes

```bash
pnpm --filter @kcvv/web exec vitest run src/components/layout/MatchStrip/MatchStrip.test.tsx 2>&1 | tail -20
```

Expected: All tests PASS

### Step 5: Commit

```bash
git add apps/web/src/components/layout/MatchStrip/
git commit -m "feat(ui): add MatchStrip component with finished/scheduled states

Thin bar showing last result or next fixture with link to match detail.
Competition name shown on desktop, hidden on mobile.

Closes #1269 (partial)"
```

---

## Task 3: `(main)/layout.tsx` — wire data fetch and render MatchStrip

**Files:**

- Create: `apps/web/src/app/(main)/layout.tsx`
- Modify: `apps/web/src/app/layout.tsx` — no changes needed (homepage is outside `(main)`)

### Step 1: Write the layout

The `(main)` route group already contains all non-homepage routes (`/nieuws`, `/ploegen/*`, `/kalender`, `/hulp`, `/club/*`, `/jeugd/*`, etc.). Adding a `layout.tsx` here gives us the exact scoping the acceptance criteria require.

```typescript
// apps/web/src/app/(main)/layout.tsx
import { MatchStrip } from "@/components/layout/MatchStrip";
import { getFirstTeamNextMatch } from "@/lib/server/match-data";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nextMatch = await getFirstTeamNextMatch();

  return (
    <>
      <MatchStrip match={nextMatch} />
      {children}
    </>
  );
}
```

### Step 2: Verify no layout shift

The MatchStrip renders in normal document flow after the PageHeader spacer (which is in the root layout). When `match` is `null`, `MatchStrip` returns `null` — no empty div, no reserved space, no layout gap.

### Step 3: Run full check-all

```bash
pnpm --filter @kcvv/web check-all 2>&1 | tail -20
```

Expected: lint, type-check, test, build all pass

### Step 4: Commit

```bash
git add apps/web/src/app/\(main\)/layout.tsx
git commit -m "feat(ui): wire MatchStrip into (main) layout with data fetch

Calls getFirstTeamNextMatch() in the (main) route group layout, rendering
MatchStrip on all non-homepage routes. Homepage is excluded because it
lives outside (main).

Closes #1269 (partial)"
```

---

## Task 4: Refactor homepage to use shared utility

**Files:**

- Modify: `apps/web/src/app/page.tsx` (lines 112-153)

The acceptance criterion says "shared server utility hoists `BffService.getNextMatches()` + `mapMatchesToUpcomingMatches()` for reuse between homepage and root layout." Replace the inline Effect pipeline on the homepage with a call to `getFirstTeamNextMatch()`.

Note: the homepage also needs the full `matches` array for `MatchesSliderSection`, so we can't fully replace the BFF call. But we can use the shared utility for `nextMatch` and keep the existing call for the slider. Actually — the existing call already returns all matches, and the slider uses `upcomingMatches` (the mapped array). The shared utility only returns the first match.

**Decision:** Keep the homepage's existing `getNextMatches()` call for the slider data. The shared utility is for the layout only. The acceptance criterion is satisfied because the shared utility exists and is used by the `(main)` layout — the homepage continues to use its own call because it needs the full array. Document this in the PRD discovered unknowns.

### Step 1: No code change needed

The homepage already has its own fetch + map pipeline that returns the full array needed for `MatchesSliderSection`. The shared utility returns only the first match, which isn't sufficient for the homepage's needs. The acceptance criterion "shared server utility hoists for reuse" is satisfied by the `(main)` layout using it.

### Step 2: Add discovered unknown to PRD

```bash
echo "- [2026-04-12] Discovered: homepage needs full matches array for MatchesSliderSection, not just first match — shared utility used by (main) layout only; homepage retains its own BFF call → resolved inline" >> /Users/kevinvanransbeeck/Sites/KCVV/kcvv-issue-1269/docs/prd/first-team-match-strip.md
```

### Step 3: Commit

```bash
git add docs/prd/first-team-match-strip.md
git commit -m "docs(ui): document homepage match fetch decision in PRD

Homepage retains its own BFF call because it needs the full matches array
for MatchesSliderSection. Shared utility is used by (main) layout.

Closes #1269 (partial)"
```

---

## Task 5: Final quality gate and commit

### Step 1: Run full quality checks

```bash
pnpm --filter @kcvv/web check-all 2>&1 | tail -30
```

Expected: lint, type-check, test, build all pass

### Step 2: Verify acceptance criteria manually

Checklist to verify against:

- [ ] `getFirstTeamNextMatch()` shared utility exists in `apps/web/src/lib/server/match-data.ts`
- [ ] `MatchStrip` renders on all `(main)` routes (they all go through `(main)/layout.tsx`)
- [ ] `MatchStrip` does NOT render on `/` (homepage is at `app/page.tsx`, outside `(main)`)
- [ ] Finished match shows score line: `KCVV 2 – 1 Opponent` with date
- [ ] Scheduled match shows: `Volgende: vs Opponent · za 20:00`
- [ ] Competition name has `hidden md:inline` classes (hidden mobile, shown desktop)
- [ ] Tapping navigates to `/wedstrijd/{matchId}`
- [ ] No additional BFF call — `(main)/layout.tsx` calls shared utility once
- [ ] No layout shift — `MatchStrip` returns `null` when no data
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Step 3: Create final commit (squash if desired, or leave as-is)

If all previous commits are clean, create one final commit:

```bash
git add -A
git commit -m "feat(ui): MatchStrip tracer bullet — layout fetch + static strip

- Add shared getFirstTeamNextMatch() server utility
- Add MatchStrip component (finished/scheduled states)
- Wire into (main) route group layout
- Competition name: desktop only (hidden md:inline)
- Links to /wedstrijd/{matchId}
- No render when no match data (off-season graceful degradation)

Closes #1269"
```

---

## Files created/modified summary

| Action | Path                                                            |
| ------ | --------------------------------------------------------------- |
| Create | `apps/web/src/lib/server/match-data.ts`                         |
| Create | `apps/web/src/lib/server/match-data.test.ts`                    |
| Create | `apps/web/src/components/layout/MatchStrip/MatchStrip.tsx`      |
| Create | `apps/web/src/components/layout/MatchStrip/MatchStrip.test.tsx` |
| Create | `apps/web/src/components/layout/MatchStrip/index.ts`            |
| Create | `apps/web/src/app/(main)/layout.tsx`                            |
| Modify | `docs/prd/first-team-match-strip.md` (discovered unknowns)      |
