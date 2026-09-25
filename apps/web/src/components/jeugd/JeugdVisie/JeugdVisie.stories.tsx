import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, expect, waitFor } from "storybook/test";
import { armColdLoadHash } from "@test-storybook/coldLoadHash";
import { JeugdVisie } from "./JeugdVisie";
import { VisieHashLandingCorrection } from "./VisieHashLandingCorrection";

const meta = {
  title: "Features/Jeugd/JeugdVisie",
  component: JeugdVisie,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'The `/jeugd` filosofie/visie block (Phase 7 / 7j0b). Carries the `#visie` anchor. A mono section kicker "Onze jeugdvisie" above a cream `<PullQuote>` (default flow placement) carrying the visie statement and a mono tag row in the `labels` slot (#2566).',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto w-full max-w-[70rem] px-4 py-10 sm:py-14">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JeugdVisie>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The filosofie/visie block as it renders below the hero seam. */
export const Default: Story = {};

/**
 * Mobile viewport — the quote-mark + body grid holds on narrow screens
 * (#2803).
 */
export const MobileViewport: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
  parameters: {
    vr: { viewports: ["mobile"] },
  },
};

/**
 * Re-homed from `apps/web/test/e2e/section-nav.spec.ts`'s "`/jeugd#visie` —
 * no section nav on this route, lands below the header alone" case (#3146,
 * deleted by this ticket). `/jeugd` carries no sticky in-page nav — the
 * anchor offset here is `globals.css`'s header-only `scroll-padding-top`
 * base rule (`--sticky-header-h`, a static 65px token, not a JS-measured
 * one) rather than `useSectionNav`'s derived bar-plus-header offset. Mounts
 * `<VisieHashLandingCorrection>` alongside `<JeugdVisie>` the same way
 * `page.tsx` does (a sibling, not a child — see `JeugdVisie.tsx`'s
 * docblock), with the hash already in the URL before mount (a cold load,
 * not a same-page hash change — same technique as
 * `OrganigramSectionNav.stories.tsx`'s cold-load case) and enough content
 * above `#visie` that a real landing offset is measurable. `!autodocs`
 * (review finding 9): the docs page renders every story's decorator on one
 * shared page — this one mutates `window.location.hash` as a side effect
 * of merely being displayed, which has no business happening there. `!vr`:
 * assertion-only.
 */
export const ColdLoadHashLandsBelowTheHeaderAlone: Story = {
  tags: ["!vr", "!autodocs"],
  loaders: [armColdLoadHash("#visie")],
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto w-full max-w-[70rem] px-4">
        <div className="h-[150vh]" aria-hidden />
        <Story />
        <VisieHashLandingCorrection />
        {/* Trailing spacer (measured 2026-09-25, fixing review finding
            1's new upper-bound assertion): without room to scroll PAST
            `#visie`, the browser clamps `scrollIntoView`'s target to the
            document's own max scroll position, landing short of the
            65px offset regardless of whether the correction ran — a
            false negative this test would otherwise never catch, since
            nothing before this depended on the landing being exact. */}
        <div className="h-screen" aria-hidden />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = canvas.getByText("Onze jeugdvisie").closest("section")!;

    // In a `finally` (review finding 9) — `play` is the only place that
    // ever sets this hash back, since `!autodocs` above keeps the docs
    // page from ever mounting this story's `loaders` at all.
    try {
      await waitFor(() => {
        const top = section.getBoundingClientRect().top;
        // `--sticky-header-h` (globals.css) — no `<SiteHeader>` mounted in
        // this fixture, so the static token stands in for it directly.
        // Both bounds (review finding 1): a lower bound alone passes
        // vacuously if `useHashLandingCorrection` is deleted outright —
        // with no correction, `window.scrollY` never moves off 0 and
        // `#visie` sits at its natural, un-scrolled document position
        // (~1200px+ below the 150vh spacer), which is also `>= 63`. The
        // upper bound is what actually proves the landing, not just "not
        // behind the header".
        expect(top).toBeGreaterThanOrEqual(65 - 2);
        expect(top).toBeLessThanOrEqual(65 + 2);
      });
    } finally {
      canvasElement.ownerDocument.defaultView?.history.replaceState(
        null,
        "",
        "#",
      );
    }
  },
};
