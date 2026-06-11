import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OrganigramSectionNav } from "./OrganigramSectionNav";
import {
  HUB_SEARCH_MEMBERS,
  HUB_SEARCH_PATHS,
} from "../HubSearch/hub-search.fixture";

const meta = {
  title: "Organigram/OrganigramSectionNav",
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
        <section
          id="hulp"
          className="mx-auto max-w-[70rem] scroll-mt-32 px-4 py-20"
        >
          <h2 className="font-display text-ink text-3xl font-bold">Hulp</h2>
          <p className="text-ink-muted mt-2">
            Placeholder Hulp-sectie (scroll verder voor Structuur).
          </p>
          <div className="h-[80vh]" />
        </section>
        <section
          id="structuur"
          className="bg-cream-soft mx-auto max-w-[70rem] scroll-mt-32 px-4 py-20"
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
