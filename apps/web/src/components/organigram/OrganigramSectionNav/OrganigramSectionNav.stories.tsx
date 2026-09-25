import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, expect, waitFor } from "storybook/test";
import { armColdLoadHash } from "@test-storybook/coldLoadHash";
import { OrganigramSectionNav } from "./OrganigramSectionNav";
import {
  HUB_SEARCH_MEMBERS,
  HUB_SEARCH_PATHS,
} from "../HubSearch/hub-search.fixture";

const meta = {
  title: "Features/Organigram/OrganigramSectionNav",
  component: OrganigramSectionNav,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The hub's sticky in-page section nav: two doors (Hulp / Structuur) with a scroll-driven active state + the unified `<HubSearch>` repeated compactly. Scroll the preview to watch the active door follow the section in view.",
      },
    },
  },
  args: {
    members: HUB_SEARCH_MEMBERS,
    responsibilityPaths: HUB_SEARCH_PATHS,
  },
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-[200vh]">
        <Story />
        <div
          id="hub-hero"
          className="bg-jersey-deep-dark text-cream mx-auto mt-4 flex h-[60vh] max-w-[80rem] items-center justify-center"
        >
          Hero — scroll voorbij om de nav-zoekbalk te onthullen
        </div>
        <section id="hulp" className="mx-auto max-w-[70rem] px-4 py-20">
          <h2 className="font-display text-ink text-3xl font-bold">Hulp</h2>
          <p className="text-ink-muted mt-2">
            Placeholder Hulp-sectie (scroll verder voor Structuur).
          </p>
          <div className="h-[80vh]" />
        </section>
        <section
          id="structuur"
          className="bg-cream-soft mx-auto max-w-[70rem] px-4 py-20"
        >
          <h2 className="font-display text-ink text-3xl font-bold">
            Structuur
          </h2>
          <p className="text-ink-muted mt-2">Placeholder Structuur-sectie.</p>
          <div className="h-[80vh]" />
        </section>
      </div>
    ),
  ],
} satisfies Meta<typeof OrganigramSectionNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * The trailing slot revealed — the state `Default` can never capture.
 *
 * `<HubSearch variant="nav">` is gated on `heroOutOfView`, and the shared
 * decorator renders `#hub-hero` in view at scroll 0, so `Default`'s three VR
 * baselines contain no slot at all. That left the one thing #2821 changed —
 * the slot's height against the chip's, and the row that no longer wraps —
 * with zero visual coverage, while `section-nav.ts` claimed these baselines
 * were what caught a drift.
 *
 * This story parks `#hub-hero` entirely above the viewport, so the observer
 * reports it out of view on the first callback and the slot mounts at scroll
 * 0, where a screenshot can see it. It overrides the shared decorator rather
 * than adding to it, so nothing else is on screen to confuse the diff.
 *
 * Watch for two things in the baseline: the slot is **not taller than the
 * chips beside it** (that is the rule), and at mobile width it stays **on the
 * chips' row** instead of dropping to a second line.
 */
export const RevealedSearch: Story = {
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-[120vh]">
        <div id="hub-hero" className="absolute -top-[300px] h-[200px] w-full" />
        <Story />
        <section id="hulp" className="mx-auto max-w-[70rem] px-4 py-20">
          <h2 className="font-display text-ink text-3xl font-bold">Hulp</h2>
        </section>
        <section id="structuur" className="mx-auto max-w-[70rem] px-4 py-20">
          <h2 className="font-display text-ink text-3xl font-bold">
            Structuur
          </h2>
        </section>
      </div>
    ),
  ],
};

/**
 * Re-homed from `apps/web/test/e2e/section-nav.spec.ts`'s "OrganigramSectionNav
 * on /hulp" case (#3146, deleted by this ticket — the flake ledger's worst
 * row: ~50% first-attempt failure against live hydration timing, see #3077).
 * Rule 3 (#2478): the fill always means "the section being read", never
 * "the one last clicked". `<TeamSectionNav>` shares the exact same
 * `useSectionNav` hook and `<SectionNavChip>`, so proving the scroll-spy
 * invariant here proves it there too (push it down, #3086 clause 1) — it
 * has no story of its own (a page-route component, not a design-system
 * one), and route smoke (`/ploegen/[slug]` in `routes.spec.ts`) still
 * confirms the route itself renders. `Default`'s fixture already guarantees
 * both sections exist at fixed ids; a real browser's `IntersectionObserver`
 * does the rest. `!vr`: assertion-only.
 */
export const ScrollSpyMarksTheActiveSection: Story = {
  tags: ["!vr"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Secties van de hub" });
    const structuur = within(nav).getByRole("link", { name: "Structuur" });
    const hulp = within(nav).getByRole("link", { name: "Hulp" });

    canvasElement.ownerDocument
      .getElementById("structuur")
      ?.scrollIntoView({ block: "start", behavior: "instant" });
    await waitFor(() => {
      expect(structuur).toHaveAttribute("aria-current", "location");
    });
    expect(hulp).not.toHaveAttribute("aria-current");

    // Scrolling back up flips the fill again — it tracks reading position
    // on every pass, not just the first jump.
    canvasElement.ownerDocument
      .getElementById("hulp")
      ?.scrollIntoView({ block: "start", behavior: "instant" });
    await waitFor(() => {
      expect(hulp).toHaveAttribute("aria-current", "location");
    });
    expect(structuur).not.toHaveAttribute("aria-current");
  },
};

/**
 * Re-homed from `apps/web/test/e2e/section-nav.spec.ts`'s "clicking an
 * OrganigramSectionNav door lands its section below the bar" case (#3146).
 * Rule 7 (#2478): an anchor jump lands the target section BELOW the sticky
 * bar, at an offset derived from the bar's own measured height, never
 * behind it. Runs at 375px (review finding 2/7, via story `globals` per
 * finding 7 — see `StandingsTable.stories.tsx`'s identical note) because
 * that is the width the deleted E2E case used for this exact reason: it is
 * where `<HubSearch variant="nav">` mounts into the bar mid-scroll, once
 * `#hub-hero` leaves view. Asserts that mount actually happened
 * (`Zoek een persoon of hulpvraag` visible) before reading the bar's
 * bottom edge, so this test cannot silently pass having never exercised
 * the race it exists to guard. `!vr`: assertion-only, geometry-only
 * (bounding-box math), no pixel truth to capture.
 */
export const AnchorClickLandsBelowTheBar: Story = {
  tags: ["!vr"],
  globals: { viewport: { value: "kcvvMobile" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Secties van de hub" });
    const structuurLink = within(nav).getByRole("link", { name: "Structuur" });

    // Not `userEvent.click`/`.click()` on the real `<a href="#structuur">`
    // (measured 2026-09-25): a genuine anchor-driven same-document
    // navigation inside this addon's iframe breaks the Vitest Browser Mode
    // RPC channel outright ("Browser connection was closed"), reproducibly,
    // regardless of click method. Setting `location.hash` directly is what
    // that native navigation boils down to — same `hashchange` dispatch,
    // same `useHashLandingCorrection` arm-and-correct path — without
    // tripping the harness bug.
    const barHeightBeforeMount = nav.getBoundingClientRect().height;
    window.location.hash = "#structuur";

    // In a `finally` (review finding 9): setting `location.hash` directly
    // in `play`, not a decorator, so there is no component-unmount cleanup
    // to fall back on here — a thrown assertion before the old manual reset
    // at the end would have left the hash leaked into the next story.
    try {
      await waitFor(() => {
        expect(structuurLink).toHaveAttribute("aria-current", "location");
      });

      // Proves the HubSearch-mount race was actually exercised — otherwise
      // this test could pass having scrolled straight past it.
      await expect(
        within(nav).getByRole("combobox", {
          name: "Zoek een persoon of hulpvraag",
        }),
      ).toBeVisible();

      // #2821 (see `OrganigramSectionNav.tsx`'s and `section-nav.ts`'s own
      // comments): the trailing slot's padding is tuned to stay UNDER the
      // chip's own height on purpose, so mounting HubSearch never grows the
      // bar at all any more — measured 2026-09-25, identical before/after
      // (51.25px both times at 375px). "Bar growth" from this specific mount
      // is therefore not reproducible: #2821 already fixed it. This
      // assertion is the positive guard for that invariant; the landing
      // assertion below is what actually depends on whatever the bar's
      // height happens to be, grown or not.
      expect(nav.getBoundingClientRect().height).toBe(barHeightBeforeMount);

      const barBottom = nav.getBoundingClientRect().bottom;
      const targetTop = canvasElement.ownerDocument
        .getElementById("structuur")!
        .getBoundingClientRect().top;

      // A couple of px of slack for sub-pixel rounding — never behind the bar.
      expect(targetTop).toBeGreaterThanOrEqual(barBottom - 2);
    } finally {
      // Vitest Browser Mode reuses one tab across a file's tests — clear the
      // hash this click left behind so it can't leak into the next story.
      canvasElement.ownerDocument.defaultView?.history.replaceState(
        null,
        "",
        "#",
      );
    }
  },
};

/**
 * Re-homed from `apps/web/test/e2e/section-nav.spec.ts`'s "a cold load with
 * a hash already in the URL on /hulp still lands below the bar, once
 * HubSearch mounts in the nav" case (#3146) — the gap a hand-written
 * `scroll-mt-*` used to leave uncovered: `useHashLandingCorrection`'s
 * `correct()` only runs from an effect, so a cold load needs the hash
 * already armed and corrected once layout (including the bar's own
 * measured height) has settled, not merely once `useSectionNav` mounts.
 * A `loaders` entry (`armColdLoadHash`) sets `window.location.hash` BEFORE
 * the component mounts — a real cross-document cold load, not a same-page
 * hash change — mirroring the original test's sentinel-checked cold
 * navigation, and without assigning inside a decorator's render body
 * (`react-hooks/immutability` correctly rejects that as a component
 * modifying a value outside itself). Runs at 375px (review finding 2/7)
 * for the same HubSearch-mount reason as `AnchorClickLandsBelowTheBar`,
 * and asserts that mount happened before reading the bar's bottom edge.
 * `!autodocs` (review finding 9): the docs page renders every story's
 * loaders/decorator on one shared page without running `play` — this one
 * mutates `window.location.hash` as a side effect of merely being
 * displayed, and never resets it, which has no business happening there.
 * `!vr`: assertion-only.
 */
export const ColdLoadHashLandsBelowTheBar: Story = {
  tags: ["!vr", "!autodocs"],
  // 375px (review finding 2/7) — same reason as `AnchorClickLandsBelowTheBar`.
  globals: { viewport: { value: "kcvvMobile" } },
  loaders: [armColdLoadHash("#structuur")],
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-[200vh]">
        <Story />
        <div
          id="hub-hero"
          className="bg-jersey-deep-dark text-cream mx-auto mt-4 flex h-[60vh] max-w-[80rem] items-center justify-center"
        >
          Hero
        </div>
        <section id="hulp" className="mx-auto max-w-[70rem] px-4 py-20">
          <h2 className="font-display text-ink text-3xl font-bold">Hulp</h2>
          <div className="h-[80vh]" />
        </section>
        <section
          id="structuur"
          className="bg-cream-soft mx-auto max-w-[70rem] px-4 py-20"
        >
          <h2 className="font-display text-ink text-3xl font-bold">
            Structuur
          </h2>
          <div className="h-[80vh]" />
        </section>
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Secties van de hub" });
    const structuurLink = within(nav).getByRole("link", { name: "Structuur" });

    // In a `finally` (review finding 9) — `play` is the only place that
    // ever sets this hash back, since `!autodocs` above keeps the docs
    // page from ever mounting this story's `loaders` at all.
    try {
      await waitFor(() => {
        expect(structuurLink).toHaveAttribute("aria-current", "location");
      });

      // Proves the HubSearch-mount race was actually exercised — otherwise
      // this test could pass having never scrolled the hero out of view at
      // all. "Bar growth" itself is not reproducible any more (#2821 fixed
      // it — see the identical measurement + comment on
      // `AnchorClickLandsBelowTheBar` above), so there is no before/after
      // height to compare here; the landing assertion below still depends
      // on the bar's real (unchanged) height regardless.
      await expect(
        within(nav).getByRole("combobox", {
          name: "Zoek een persoon of hulpvraag",
        }),
      ).toBeVisible();

      const barBottom = nav.getBoundingClientRect().bottom;
      const targetTop = canvasElement.ownerDocument
        .getElementById("structuur")!
        .getBoundingClientRect().top;
      expect(targetTop).toBeGreaterThanOrEqual(barBottom - 2);
    } finally {
      canvasElement.ownerDocument.defaultView?.history.replaceState(
        null,
        "",
        "#",
      );
    }
  },
};
