# Calendar Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add interactive month/week/day calendar views with inline iCal subscription to `/kalender`.

**Architecture:** Four new client components under `src/components/calendar/`: CalendarMonth (grid + day panel), CalendarWeek (7-day columns), CalendarSubscribePanel (iCal builder), CalendarWidget (toolbar + view orchestrator). The existing CalendarView becomes the "list" tab. The server page fetches full-season matches for all teams + events + team metadata, passing everything as props. Zero extra API calls from widgets.

**Tech Stack:** React 19, Next.js 16.2.1, Luxon (dates), qrcode.react (QR), Tailwind v4, Vitest + Testing Library, Storybook 10.

---

## Shared Types & Helpers

### Types needed in `apps/web/src/app/(main)/kalender/utils.ts`

```typescript
// Already exists: CalendarMatch, CalendarTeam, transformMatchToCalendar

// New — event representation for calendar views
export interface CalendarEvent {
  id: string;
  title: string;
  dateStart: string; // ISO
  dateEnd?: string;
  href: string;
}

// New — team info for subscription panel
export interface CalendarTeamInfo {
  id: string; // Sanity _id
  name: string;
  psdId: number; // numeric PSD team ID for iCal URL
  label: string; // display label like "A-ploeg" from match data
}

// Implemented as getMatchDotType in utils.ts — compares CalendarMatch.kcvvTeamId
// to homeTeam.id to decide "home" vs "away"; falls back to string matching on
// homeTeam.name when kcvvTeamId is absent.
export function getMatchDotType(match: CalendarMatch): "home" | "away";
```

---

## Task 1: Extend `utils.ts` with CalendarEvent type and date helpers

**Files:**

- Modify: `apps/web/src/app/(main)/kalender/utils.ts`
- Modify: `apps/web/src/app/(main)/kalender/utils.test.ts`

**Step 1: Write failing tests for new helpers**

Add tests for:

- `getMatchesForDay(matches, dateStr)` — filters matches whose ISO date matches a YYYY-MM-DD
- `getEventsForDay(events, dateStr)` — filters events whose dateStart matches a YYYY-MM-DD
- `getDaysInMonth(year, month)` — returns array of Date objects for the calendar grid (includes leading/trailing days from prev/next months to fill 6 rows)
- `getDaysInWeek(date)` — returns Mon-Sun dates for the week containing `date`
- `getMatchDotType(match)` — returns `"home" | "away"` based on whether KCVV is home team

**Step 2: Implement minimal code to pass**

**Step 3: Commit** `feat(calendar): add date helpers and CalendarEvent type`

---

## Task 2: CalendarMonth component — grid rendering

**Files:**

- Create: `apps/web/src/components/calendar/CalendarMonth/CalendarMonth.tsx`
- Create: `apps/web/src/components/calendar/CalendarMonth/CalendarMonth.test.tsx`
- Create: `apps/web/src/components/calendar/CalendarMonth/index.ts`

**Props:**

```typescript
interface CalendarMonthProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  currentMonth: number; // 0-11
  currentYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}
```

**Test cases (RED first, then GREEN):**

1. Renders 7 day-of-week headers (Ma, Di, Wo, Do, Vr, Za, Zo)
2. Renders correct number of day cells for a month (35 or 42)
3. Today's date has `bg-gray-100` highlight
4. Selected date has `bg-kcvv-green-bright text-white` highlight
5. Days outside current month have `text-gray-300`
6. Home match day shows filled green dot
7. Away match day shows outlined green dot
8. Event day shows blue dot
9. Clicking a day calls `onSelectDate` with YYYY-MM-DD
10. Prev/next month buttons call their handlers
11. Month/year label displays correctly (e.g. "Maart 2026")

**Day panel (below grid):** 12. Shows selected date formatted as "Zaterdag 22 maart" 13. Renders MatchTeaser (compact) for matches on selected day 14. Renders event cards for events on selected day 15. Shows empty state "Geen wedstrijden of activiteiten op deze dag." 16. Content fades on day change (test transition class presence)

**Step N: Commit** `feat(calendar): CalendarMonth grid and day panel`

---

## Task 3: CalendarWeek component

**Files:**

- Create: `apps/web/src/components/calendar/CalendarWeek/CalendarWeek.tsx`
- Create: `apps/web/src/components/calendar/CalendarWeek/CalendarWeek.test.tsx`
- Create: `apps/web/src/components/calendar/CalendarWeek/index.ts`

**Props:**

```typescript
interface CalendarWeekProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  weekStart: string; // YYYY-MM-DD (Monday)
  onPrevWeek: () => void;
  onNextWeek: () => void;
}
```

**Test cases:**

1. Renders 7 day column headers (Ma 23 ... Zo 29)
2. Matches appear in correct day column as compact MatchTeaser
3. Events appear in correct day column
4. Empty columns show nothing (no placeholder)
5. Week navigation arrows call handlers
6. Week label shows date range (e.g. "23 - 29 maart 2026")

**Step N: Commit** `feat(calendar): CalendarWeek 7-day column view`

---

## Task 4: CalendarSubscribePanel component

**Files:**

- Create: `apps/web/src/components/calendar/CalendarSubscribePanel/CalendarSubscribePanel.tsx`
- Create: `apps/web/src/components/calendar/CalendarSubscribePanel/CalendarSubscribePanel.test.tsx`
- Create: `apps/web/src/components/calendar/CalendarSubscribePanel/index.ts`

**Props:**

```typescript
interface CalendarSubscribePanelProps {
  teams: CalendarTeamInfo[];
  preselectedTeamLabel?: string; // from active filter
  isOpen: boolean;
}
```

**Test cases:**

1. Not rendered when `isOpen` is false
2. Shows team multi-select with all teams as chip/tag items
3. Pre-selects team matching `preselectedTeamLabel`
4. Shows side filter dropdown with "Alle wedstrijden", "Alleen thuiswedstrijden", "Alleen uitwedstrijden"
5. Generates correct webcal URL: `webcal://kcvvelewijt.be/api/calendar.ics?teamIds=X,Y&side=all`
6. URL updates when team selection changes
7. URL updates when side filter changes
8. "Kopieer link" button copies URL to clipboard (mock navigator.clipboard)
9. Shows "Gekopieerd" feedback after copy
10. "Toon QR-code" toggle shows QR code
11. QR code contains the webcal URL

**Step N: Commit** `feat(calendar): CalendarSubscribePanel with iCal URL builder`

---

## Task 5: CalendarWidget — toolbar + view orchestrator

**Files:**

- Create: `apps/web/src/components/calendar/CalendarWidget/CalendarWidget.tsx`
- Create: `apps/web/src/components/calendar/CalendarWidget/CalendarWidget.test.tsx`
- Create: `apps/web/src/components/calendar/CalendarWidget/index.ts`

**Props:**

```typescript
interface CalendarWidgetProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  teams: CalendarTeamInfo[];
  activeTeamFilter: string; // "all" or team label
}
```

**Behavior:**

- Reads `?view=month|week|list` from URL (default: `month` on desktop, `list` on mobile)
- Maintains selected date state (default: today)
- Manages month/week navigation state
- Toggles subscribe panel

**Test cases:**

1. Renders view tabs: Maand, Week, Lijst
2. Active tab matches URL `?view=` param
3. Clicking tab updates URL to `?view=X`
4. Week tab hidden on mobile (test responsive class `hidden md:inline-flex`)
5. "Abonneer" button present in toolbar
6. Clicking "Abonneer" toggles subscribe panel
7. Subscribe panel receives `preselectedTeamLabel` from `activeTeamFilter`
8. Month view renders CalendarMonth when `view=month`
9. Week view renders CalendarWeek when `view=week`
10. List view renders CalendarView when `view=list`
11. Team filter tabs work across all views (passed through to child views)

**Step N: Commit** `feat(calendar): CalendarWidget toolbar and view switcher`

---

## Task 6: Update calendar page — full data fetch

**Files:**

- Modify: `apps/web/src/app/(main)/kalender/page.tsx`

**Changes:**

1. Fetch teams via `TeamRepository.findAll()` → extract teams with psdId
2. Fetch matches via `BffService.getMatches(teamId)` for each team with a psdId, in parallel
3. Deduplicate matches by `id`
4. Fetch events via `EventRepository.findAll()`
5. Transform to `CalendarMatch[]`, `CalendarEvent[]`, `CalendarTeamInfo[]`
6. Pass to `CalendarWidget` instead of `CalendarView`
7. Set `revalidate = 21600` (6 hours)

**Test approach:** Server component — test indirectly via integration or skip (no unit test for page.tsx fetch logic per existing patterns).

**Step N: Commit** `feat(calendar): full-season data fetch with team + event data`

---

## Task 7: Storybook stories

**Files:**

- Create: `apps/web/src/components/calendar/CalendarMonth/CalendarMonth.stories.tsx`
- Create: `apps/web/src/components/calendar/CalendarWeek/CalendarWeek.stories.tsx`
- Create: `apps/web/src/components/calendar/CalendarSubscribePanel/CalendarSubscribePanel.stories.tsx`
- Create: `apps/web/src/components/calendar/CalendarWidget/CalendarWidget.stories.tsx`

**Stories per component (from issue spec):**

CalendarMonth: Default, SelectedDayWithMatches, SelectedDayWithEvent, SelectedDayEmpty, NoMatchesInMonth
CalendarWeek: Default (matches on Sa/Su), EmptyWeek
CalendarSubscribePanel: Default (all teams), PrefilledSingleTeam, WithQRCodeOpen, CopiedFeedback
CalendarWidget: MonthView, WeekView, ListView, SubscribePanelOpen

**Title prefix:** `Features/Calendar/[ComponentName]`

**Step N: Commit** `feat(calendar): Storybook stories for all calendar components`

---

## Task 8: Final checks and cleanup

1. Run `pnpm --filter @kcvv/web lint:fix`
2. Run `pnpm --filter @kcvv/web check-all`
3. Fix any type errors, lint issues
4. Verify test coverage >= 80% for new components

**Step N: Commit** `chore(calendar): lint fixes and cleanup`

---

## Execution order

Tasks 1-5 are sequential (each builds on prior). Task 6 integrates everything. Task 7 (stories) can run after Task 5. Task 8 is final.

Total: ~8 commits before PR.
