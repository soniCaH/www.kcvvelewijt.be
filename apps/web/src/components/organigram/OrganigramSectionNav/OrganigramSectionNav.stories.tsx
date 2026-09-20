import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
