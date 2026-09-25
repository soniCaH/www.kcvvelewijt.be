import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, expect, waitFor } from "storybook/test";
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
 * above `#visie` that a real landing offset is measurable. `!vr`:
 * assertion-only.
 */
export const ColdLoadHashLandsBelowTheHeaderAlone: Story = {
  tags: ["!vr"],
  decorators: [
    (Story) => {
      window.location.hash = "#visie";
      return (
        <div className="bg-cream mx-auto w-full max-w-[70rem] px-4">
          <div className="h-[150vh]" aria-hidden />
          <Story />
          <VisieHashLandingCorrection />
        </div>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = canvas.getByText("Onze jeugdvisie").closest("section")!;

    await waitFor(() => {
      const top = section.getBoundingClientRect().top;
      // `--sticky-header-h` (globals.css) — no `<SiteHeader>` mounted in
      // this fixture, so the static token stands in for it directly.
      expect(top).toBeGreaterThanOrEqual(65 - 2);
    });

    canvasElement.ownerDocument.defaultView?.history.replaceState(
      null,
      "",
      "#",
    );
  },
};
