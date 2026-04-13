# Future Match Detail Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 404 errors on `/wedstrijd/${matchId}` for future/unplayed matches by making the BFF schema accept `null` for `lineup`, `substitutes`, `events`, and `viewGameReport`, and render a "Nog niet gespeeld" placeholder instead of lineup/events sections.

**Architecture:** Two-layer fix. The BFF schema (`apps/api`) accepts `null` values PSD returns for unplayed matches. The web frontend (`apps/web`) conditionally renders a "Nog niet gespeeld" message for scheduled matches. Additionally, the MatchWidget link logic is updated so scheduled matches link to `/wedstrijd/${matchId}` instead of `/kalender`.

**Tech Stack:** Effect Schema, Vitest, React Testing Library, Next.js

---

## Task 1: BFF Schema — Accept null for lineup/substitutes/events/viewGameReport

**Files:**

- Modify: `apps/api/src/psd/schemas.ts:121,130-132`
- Test: `apps/api/src/psd/schemas.test.ts`

### Step 1: Write the failing test

Add a test case in `schemas.test.ts` that decodes a PSD response where `lineup`, `substitutes`, `events`, and `viewGameReport` are all `null` (the shape PSD returns for unplayed matches):

```typescript
it("decodes a response with null lineup, substitutes, events, and viewGameReport", () => {
  const raw = {
    general: {
      id: 2,
      date: "2026-05-15 20:00",
      homeClub: { id: 123, name: "KCVV Elewijt" },
      awayClub: { id: 456, name: "Opponent FC" },
      goalsHomeTeam: null,
      goalsAwayTeam: null,
      competitionType: { id: 1, name: "3de Nationale", type: "LEAGUE" },
      viewGameReport: null,
      status: 0,
    },
    lineup: null,
    substitutes: null,
    events: null,
  };
  const result = S.decodeUnknownSync(FootbalistoMatchDetailResponse)(raw);
  expect(result.general.id).toBe(2);
  expect(result.lineup).toBeNull();
  expect(result.substitutes).toBeNull();
  expect(result.events).toBeNull();
  expect(result.general.viewGameReport).toBeNull();
});
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @kcvv/api exec vitest run src/psd/schemas.test.ts 2>&1 | tail -20
```

Expected: FAIL — Effect Schema rejects `null` for `lineup`, `viewGameReport`, etc.

### Step 3: Fix the schema

In `apps/api/src/psd/schemas.ts`, make these changes:

**Line 121** — `viewGameReport`:

```typescript
// Before:
viewGameReport: S.Boolean,
// After:
viewGameReport: S.NullOr(S.Boolean),
```

**Line 130** — `lineup`:

```typescript
// Before:
lineup: S.optional(FootbalistoLineup),
// After:
lineup: S.optional(S.NullOr(FootbalistoLineup)),
```

**Line 131** — `substitutes`:

```typescript
// Before:
substitutes: S.optional(FootbalistoLineup),
// After:
substitutes: S.optional(S.NullOr(FootbalistoLineup)),
```

**Line 132** — `events`:

```typescript
// Before:
events: S.optional(S.Array(S.Unknown)),
// After:
events: S.optional(S.NullOr(S.Array(S.Unknown))),
```

### Step 4: Run test to verify it passes

```bash
pnpm --filter @kcvv/api exec vitest run src/psd/schemas.test.ts 2>&1 | tail -20
```

Expected: PASS

---

## Task 2: BFF Transform — Handle null viewGameReport

**Files:**

- Modify: `apps/api/src/psd/transforms.ts:476`
- Test: `apps/api/src/psd/service.test.ts`

### Step 1: Write the failing test

Add a test in the "PsdService.getMatchDetail - resilient decoding" describe block that verifies a future match with `viewGameReport: null` produces `hasReport: false`:

```typescript
it("handles null viewGameReport for unplayed matches", async () => {
  const futureMatchResponse = {
    general: {
      ...rawDetailResponse.general,
      viewGameReport: null,
      goalsHomeTeam: null,
      goalsAwayTeam: null,
      status: 0,
    },
    lineup: null,
    substitutes: null,
    events: null,
  };
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => futureMatchResponse,
  });

  const result = await runService((svc) => svc.getMatchDetail(42));

  expect(result._tag).toBe("Right");
  if (result._tag === "Right") {
    expect(result.right.hasReport).toBe(false);
    expect(result.right.lineup).toBeUndefined();
    expect(result.right.events).toBeUndefined();
  }
});
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @kcvv/api exec vitest run src/psd/service.test.ts -t "handles null viewGameReport" 2>&1 | tail -20
```

Expected: FAIL — `hasReport` is `null`, not `false`.

### Step 3: Fix the transform

In `apps/api/src/psd/transforms.ts`, line 476:

```typescript
// Before:
hasReport: general.viewGameReport,
// After:
hasReport: general.viewGameReport ?? false,
```

The `lineup` and `events` transforms already handle null correctly:

- `response.events ? ...` — null is falsy, produces `[]`, then `validEvents.length > 0` is false → events stays `undefined`
- `if (response.lineup || response.substitutes)` — null is falsy, block is skipped → lineup stays `undefined`

### Step 4: Run test to verify it passes

```bash
pnpm --filter @kcvv/api exec vitest run src/psd/service.test.ts -t "handles null viewGameReport" 2>&1 | tail -20
```

Expected: PASS

### Step 5: Run full BFF test suite

```bash
pnpm --filter @kcvv/api exec vitest run 2>&1 | tail -20
```

Expected: All tests PASS (no regressions)

---

## Task 3: MatchDetailView — "Nog niet gespeeld" for unplayed matches

**Files:**

- Modify: `apps/web/src/components/match/MatchDetailView/MatchDetailView.tsx:142-162`
- Test: `apps/web/src/components/match/MatchDetailView/MatchDetailView.test.tsx`

### Step 1: Write the failing test

Add a test case that verifies a scheduled match shows "Nog niet gespeeld" and hides lineup/events:

```typescript
it("renders 'Nog niet gespeeld' for scheduled matches", () => {
  render(
    <MatchDetailView
      homeTeam={{ name: "KCVV Elewijt", logo: "/home.png" }}
      awayTeam={{ name: "Opponent FC", logo: "/away.png" }}
      date={new Date("2026-05-15")}
      time="20:00"
      status="scheduled"
      competition="3de Nationale"
      homeLineup={[]}
      awayLineup={[]}
      hasReport={false}
    />,
  );
  expect(screen.getByText("Nog niet gespeeld")).toBeInTheDocument();
  expect(
    screen.queryByText("Geen opstellingen beschikbaar voor deze wedstrijd."),
  ).not.toBeInTheDocument();
});
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @kcvv/web exec vitest run src/components/match/MatchDetailView/MatchDetailView.test.tsx -t "Nog niet gespeeld" 2>&1 | tail -20
```

Expected: FAIL — "Nog niet gespeeld" not found in document.

### Step 3: Implement the conditional render

In `MatchDetailView.tsx`, replace the lineup + events section (lines ~142-162) with a status check. When `status === "scheduled"`, render a single "Nog niet gespeeld" message instead of MatchLineup and MatchEvents:

```tsx
{
  /* Match Content — Lineup & Events (played) or placeholder (unplayed) */
}
{
  status === "scheduled" ? (
    <div className="flex items-center justify-center py-12">
      <p className="text-gray-500 text-sm">Nog niet gespeeld</p>
    </div>
  ) : (
    <>
      {/* Lineup Section - MatchLineup handles empty state internally */}
      <MatchLineup
        homeTeamName={homeTeam.name}
        awayTeamName={awayTeam.name}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
      />

      {/* Events Section */}
      {events !== undefined && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Wedstrijdgebeurtenissen
          </h2>
          <MatchEvents
            homeTeamName={homeTeam.name}
            awayTeamName={awayTeam.name}
            events={events}
          />
        </div>
      )}
    </>
  );
}
```

### Step 4: Run test to verify it passes

```bash
pnpm --filter @kcvv/web exec vitest run src/components/match/MatchDetailView/MatchDetailView.test.tsx 2>&1 | tail -20
```

Expected: All tests PASS (including new test, and existing played match tests still pass)

---

## Task 4: MatchWidget Link — Scheduled matches link to /wedstrijd/:id

**Files:**

- Modify: `apps/web/src/components/home/MatchWidget/MatchWidget.tsx:50-56`
- Test: `apps/web/src/components/home/MatchWidget/MatchWidget.test.tsx`

### Step 1: Update existing test expectation

The test at line 186-189 currently expects scheduled matches to link to `/kalender`. Update it to expect `/wedstrijd/${matchId}`:

```typescript
it("links upcoming match to match detail page", () => {
  render(<MatchWidget match={mockUpcomingMatch} />);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute(
    "href",
    `/wedstrijd/${mockUpcomingMatch.id}`,
  );
});
```

### Step 2: Run test to verify it fails

```bash
pnpm --filter @kcvv/web exec vitest run src/components/home/MatchWidget/MatchWidget.test.tsx -t "links upcoming match" 2>&1 | tail -20
```

Expected: FAIL — expected `/wedstrijd/101` but got `/kalender`

### Step 3: Update the link logic

In `MatchWidget.tsx`, lines 50-56, update the href logic so scheduled matches link to the detail page:

```typescript
// Before:
const href = isFinished
  ? `/wedstrijd/${match.id}`
  : isPostponed
    ? "/kalender"
    : match.status === "scheduled"
      ? "/kalender"
      : TEAM_FIXTURES_FALLBACK;

// After:
const href =
  isFinished || match.status === "scheduled"
    ? `/wedstrijd/${match.id}`
    : isPostponed
      ? "/kalender"
      : TEAM_FIXTURES_FALLBACK;
```

### Step 4: Run test to verify it passes

```bash
pnpm --filter @kcvv/web exec vitest run src/components/home/MatchWidget/MatchWidget.test.tsx 2>&1 | tail -20
```

Expected: All tests PASS

---

## Task 5: Quality checks + commit

### Step 1: Run full web check-all

```bash
pnpm --filter @kcvv/web check-all 2>&1 | tail -20
```

Expected: PASS

### Step 2: Run BFF tests

```bash
pnpm --filter @kcvv/api exec vitest run 2>&1 | tail -20
```

Expected: PASS

### Step 3: Commit

```bash
git add apps/api/src/psd/schemas.ts apps/api/src/psd/schemas.test.ts \
  apps/api/src/psd/transforms.ts apps/api/src/psd/service.test.ts \
  apps/web/src/components/match/MatchDetailView/MatchDetailView.tsx \
  apps/web/src/components/match/MatchDetailView/MatchDetailView.test.tsx \
  apps/web/src/components/home/MatchWidget/MatchWidget.tsx \
  apps/web/src/components/home/MatchWidget/MatchWidget.test.tsx \
  docs/plans/2026-04-12-future-match-detail-fix.md

git commit -m "fix(matches): accept null lineup/events from PSD for future matches

PSD returns null (not undefined) for lineup, substitutes, events, and
viewGameReport on unplayed matches. The BFF schema now accepts null for
these fields. Match detail pages for future matches render a 'Nog niet
gespeeld' placeholder. MatchWidget links scheduled matches to the detail
page instead of the calendar.

Closes #1272"
```
