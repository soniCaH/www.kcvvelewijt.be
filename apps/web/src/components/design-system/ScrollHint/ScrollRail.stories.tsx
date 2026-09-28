/**
 * ScrollRail Component Stories
 *
 * The "row of discrete things" idiom (#2444, as amended by #2489) — chips,
 * crumbs, nav items. Held space follows real overflow: both control-register
 * arrows mount together and hold a 40px gutter on both sides exactly when
 * the track overflows, and the spent direction disables in place rather
 * than unmounting.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, expect, waitFor } from "storybook/test";
import { settle } from "@test-storybook/settle";
import { ScrollRail } from "./ScrollRail";

const Chip = ({ label }: { label: string }) => (
  <span className="border-ink bg-cream-soft shadow-paper-sm inline-flex shrink-0 items-center border-2 px-3 py-2 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
    {label}
  </span>
);

const fewChips = (
  <>
    <Chip label="Alles" />
    <Chip label="Nieuws" />
    <Chip label="Jeugd" />
  </>
);

const manyChips = (
  <>
    {[
      "Alles",
      "Nieuws",
      "Jeugd",
      "Evenementen",
      "Transfers",
      "Interviews",
      "Bestuur",
      "Sponsors",
      "Kalender",
      "Historiek",
    ].map((label) => (
      <Chip key={label} label={label} />
    ))}
  </>
);

const meta = {
  title: "UI/ScrollRail",
  component: ScrollRail,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Shared chrome for a row of discrete, tappable things — FilterTabs, TeamSectionNav, the organigram breadcrumb. Both control-register arrows mount together and hold a 40px gutter exactly when the track overflows; the spent direction disables in place.",
      },
    },
  },
  args: {
    role: "group",
    ariaLabel: "Voorbeeldrij",
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-md p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScrollRail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fits the row — no arrows, no held rail. */
export const Fits: Story = {
  args: {
    trackClassName: "flex gap-3",
    children: fewChips,
  },
};

/** Overflows — both arrows mount, the left one disabled at rest. */
export const Overflows: Story = {
  args: {
    trackClassName: "flex gap-3",
    children: manyChips,
  },
};

const INTERACTIVE =
  'a[href],button,input,select,textarea,[role="button"],[role="combobox"],[role="link"],[role="tab"],[role="menuitem"]';

/**
 * The Tap Target Rule (DESIGN.md, #3237): an icon-only `control`-register
 * arrow answers to a 44 × 44 hit area, measured with `elementFromPoint` —
 * `getBoundingClientRect` never changes for the invisible `hit-area`
 * `::before` this relies on. This is geometry, so it belongs in a `play`
 * against a fixture that GUARANTEES the condition, never in the E2E layer
 * against live homepage data (apps/web/CLAUDE.md: "the E2E layer owns
 * nothing geometric at all" — `UpcomingMatchesClient`'s chip row only
 * renders once more than one team has an upcoming fixture, so a live-data
 * version of this check goes red on its own in a thin week). Mirrors the
 * (deleted) E2E `tap-targets.spec.ts`'s `measureHitArea`: the same 100%
 * coverage threshold over the same 44 × 44 sample grid, and the same
 * pointer-events-off confirmation before counting a geometric overlap as
 * real. `trackEl`'s own interactive descendants (the chips) are exempt —
 * a rail arrow floats over its own scroll track by design (`ScrollRail`'s
 * gutter is only ever blank at the true start/end of the scrollable
 * range), so a chip under it stays reachable beside the arrow or by
 * scrolling past. Every other neighbour — including the row's OTHER arrow,
 * a sibling of the track rather than inside it — still counts.
 */
function measureHitArea(
  el: HTMLElement,
  trackEl: HTMLElement,
): { coverage: number; overlaps: string[] } {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const hits = (x: number, y: number) => {
    const at = document.elementFromPoint(x, y);
    return !!at && (at === el || el.contains(at));
  };

  let covered = 0;
  let total = 0;
  for (let x = cx - 20.5; x < cx + 22; x += 3) {
    for (let y = cy - 20.5; y < cy + 22; y += 3) {
      total++;
      if (hits(x, y)) covered++;
    }
  }

  const left = cx - 22;
  const right = cx + 22;
  const top = cy - 22;
  const bottom = cy + 22;
  const overlaps: string[] = [];
  for (const other of document.querySelectorAll<HTMLElement>(INTERACTIVE)) {
    if (other === el || el.contains(other) || other.contains(el)) continue;
    if (trackEl.contains(other)) continue;
    const q = other.getBoundingClientRect();
    if (!q.width || !q.height) continue;
    const ow = Math.min(right, q.right) - Math.max(left, q.left);
    const oh = Math.min(bottom, q.bottom) - Math.max(top, q.top);
    if (ow <= 0.5 || oh <= 0.5) continue;
    const previous = el.style.pointerEvents;
    el.style.pointerEvents = "none";
    const under = document.elementFromPoint(
      Math.max(left, q.left) + ow / 2,
      Math.max(top, q.top) + oh / 2,
    );
    el.style.pointerEvents = previous;
    if (under && (under === other || other.contains(under))) {
      overlaps.push(other.tagName.toLowerCase());
    }
  }

  return { coverage: Math.round((100 * covered) / total), overlaps };
}

/**
 * Re-homed from `apps/web/test/e2e/scroll-arrows.spec.ts` (#3146, deleted by
 * this ticket) — the rail arrow/overflow invariant, proven once here against
 * a fixture that GUARANTEES the overflow (ten chips in a 448px decorator)
 * rather than against whatever a live team/route happens to render that day.
 * `<ScrollRail>` is the single idiom behind every "row of discrete things"
 * consumer (`<FilterTabs>` on `/nieuws` and `/hulp`, `<TeamSectionNav>` on
 * `/ploegen/[slug]`, the organigram breadcrumb) — the mount/unmount logic
 * lives entirely in this component + `useScrollHint`, never in a consumer,
 * so proving it here proves it for all of them (push it down, #3086 clause
 * 1). `!vr`: assertion-only, no pixel truth to capture — `Overflows` above
 * already owns the baseline.
 *
 * Extended for #3237 with the tap-target hit-area proof (see
 * `measureHitArea` above) at `kcvvMobile` (375px) — the viewport the
 * acceptance criteria scope this to. The right arrow is measured at rest
 * (the only state it's enabled in before scrolling); the left arrow once
 * scrolling to the end enables it. Both states already exist below for the
 * overflow/disable assertions, so this rides the same two checkpoints
 * rather than adding a third.
 */
export const ArrowsMatchOverflow: Story = {
  args: {
    trackClassName: "flex gap-3",
    children: manyChips,
  },
  tags: ["!vr"],
  globals: { viewport: { value: "kcvvMobile" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const track = canvas.getByRole("group", {
      name: "Voorbeeldrij",
    }) as HTMLElement;

    // At rest: both arrows mount (the track overflows), left disabled
    // (nothing scrolled left of the start yet), right enabled.
    const rightArrow = (await canvas.findByLabelText(
      "Scroll right",
    )) as HTMLElement;
    const leftArrow = (await canvas.findByLabelText(
      "Scroll left",
    )) as HTMLElement;
    await expect(leftArrow).toBeDisabled();
    await expect(rightArrow).toBeEnabled();

    // Guards the `.hit-area { position: relative }` vs `.absolute` cascade
    // tie (ScrollArrowButton.tsx) — today `.absolute` wins purely by
    // Tailwind's emit order, not by any rule this test can see otherwise.
    // If that order ever flipped, the button would fall into normal flow
    // instead of staying pinned to the rail's edge, and this catches it
    // directly rather than via a knock-on layout symptom.
    expect(getComputedStyle(rightArrow).position).toBe("absolute");

    const restMeasurement = measureHitArea(rightArrow, track);
    expect(
      restMeasurement.coverage,
      "44 × 44 square resolves to the right arrow",
    ).toBe(100);
    expect(
      restMeasurement.overlaps,
      "hit area reaches a control outside the rail's own track",
    ).toEqual([]);

    // Scroll to the end — the spent direction disables IN PLACE (#2489
    // rule 1); it does not unmount. Setting `scrollLeft` fires the native
    // `scroll` event `useScrollHint` listens for.
    track.scrollLeft = track.scrollWidth;
    await waitFor(async () => {
      await expect(rightArrow).toBeDisabled();
    });
    await expect(leftArrow).toBeEnabled();

    const endMeasurement = measureHitArea(leftArrow, track);
    expect(
      endMeasurement.coverage,
      "44 × 44 square resolves to the left arrow",
    ).toBe(100);
    expect(
      endMeasurement.overlaps,
      "hit area reaches a control outside the rail's own track",
    ).toEqual([]);

    // Held space follows overflow, not scroll position — both arrows are
    // still present, never unmounted mid-scroll.
    expect(canvas.getAllByRole("button")).toHaveLength(2);
  },
};

/** Sibling of `ArrowsMatchOverflow` for the non-overflowing case — no
 * arrows mount at all when the track fits. `!vr`: assertion-only. */
export const NoOverflowNoArrows: Story = {
  args: {
    trackClassName: "flex gap-3",
    children: fewChips,
  },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Settle first (review finding 8): a synchronous query right after
    // mount can read "no arrow" before a late webfont-swap or coalesced
    // ResizeObserver remeasure has even run, passing for the wrong
    // reason rather than because the track genuinely never overflows.
    await settle(canvasElement.ownerDocument.defaultView ?? window);
    expect(canvas.queryAllByRole("button")).toHaveLength(0);
  },
};

/**
 * Regression fixture for #3016 (review finding, fixed on `<ScrollRail>`
 * itself): `useScrollHint`'s overflow arithmetic subtracts the rail's own
 * padding from `scrollWidth` on the assumption that padding shrinks the
 * track's CONTENT box while its border box stays fixed — the ordinary
 * `box-sizing: border-box` case. That assumption breaks when `<ScrollRail>`'s
 * own outer wrapper becomes a flex item: a flex item's default
 * `min-width: auto` lets the rail padding raise its own floor instead, so
 * `scrollWidth` and `clientWidth` move together and the padding gets
 * subtracted once instead of cancelling — the overflow verdict then inverts
 * on every re-measure. Shipped on `/hulp`'s audience row: ~3 arrow
 * mount/unmount flips a second while a chip stayed hovered (each hover
 * transition fires `transitionend`, which re-measures).
 *
 * `<ScrollRail>` holds up its half of the contract with `min-w-0` on its own
 * wrapper (`ScrollRail.tsx`) — this fixture puts that wrapper directly
 * inside an outer flex row (the shape that makes `min-w-0` load-bearing;
 * without a flex-item context the property is inert) and forces several
 * remeasures the way a burst of hover transitions would (`transitionend`,
 * which `useScrollHint` listens for on the track), asserting the arrow
 * state settles correctly and stays stable rather than flipping. `!vr`:
 * assertion-only, and no consumer renders this composition today (the
 * component's own docblock notes it), so there is no baseline to protect.
 */
/**
 * Dispatches `transitionend` on `track` every animation frame for
 * `durationMs` — mimicking the continuous re-measure trigger a held hover
 * produced under the #3016 defect (each hover transition fired one) — and
 * samples the rendered arrow count on every frame. A single `waitFor()`
 * sample (the first version of this test) passes on the FIRST frame that
 * happens to read the settled count, even mid-oscillation; sampling the
 * whole window is what actually proves stability rather than a lucky
 * snapshot.
 */
async function sampleArrowCountOverTime(
  canvas: ReturnType<typeof within>,
  track: HTMLElement,
  durationMs: number,
) {
  return new Promise<{ counts: number[]; flips: number }>((resolve) => {
    const counts: number[] = [];
    let flips = 0;
    let previous: number | null = null;
    const start = performance.now();
    const tick = () => {
      track.dispatchEvent(new Event("transitionend", { bubbles: true }));
      const count = canvas.queryAllByRole("button").length;
      counts.push(count);
      if (previous !== null && count !== previous) flips += 1;
      previous = count;
      if (performance.now() - start < durationMs) {
        requestAnimationFrame(tick);
      } else {
        resolve({ counts, flips });
      }
    };
    requestAnimationFrame(tick);
  });
}

export const StaysStableAsAFlexItem: Story = {
  render: (args) => (
    <div className="flex items-start gap-4">
      <ScrollRail {...args} />
      <span className="shrink-0 self-center text-xs">sibling</span>
    </div>
  ),
  args: {
    trackClassName: "flex gap-3",
    children: manyChips,
  },
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const track = canvas.getByRole("group", {
      name: "Voorbeeldrij",
    }) as HTMLElement;

    await canvas.findByLabelText("Scroll right");

    // ~1.5s of continuous remeasure pressure, well under half this test's
    // own 5s default timeout (#3143's budget) alongside the rest of the
    // test's overhead.
    const { counts, flips } = await sampleArrowCountOverTime(
      canvas,
      track,
      1500,
    );

    // Never flips away from the settled 2-arrow state across the whole
    // sampled window — the actual #3016 regression guard.
    expect(flips).toBe(0);
    expect(counts.every((count) => count === 2)).toBe(true);
    expect(track.scrollWidth).toBeGreaterThan(track.clientWidth);

    // No-bleed check (#3016's second assertion, on the same root cause —
    // see `ScrollRail.tsx`'s own `min-w-0` comment): the flex-item
    // composition must not push the story's own root past its own bounds
    // either, the fixture-level equivalent of the original E2E's
    // `document.body.scrollWidth - document.documentElement.clientWidth
    // <= 0` page-level check.
    const doc = canvasElement.ownerDocument;
    expect(doc.documentElement.scrollWidth).toBeLessThanOrEqual(
      doc.documentElement.clientWidth,
    );
  },
};
