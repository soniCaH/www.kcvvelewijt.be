import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, userEvent } from "storybook/test";
import { HubSearch } from "./HubSearch";
import { HUB_SEARCH_MEMBERS, HUB_SEARCH_PATHS } from "./hub-search.fixture";

const meta = {
  title: "Organigram/HubSearch",
  component: HubSearch,
  tags: ["autodocs", "vr"],
  args: {
    members: HUB_SEARCH_MEMBERS,
    responsibilityPaths: HUB_SEARCH_PATHS,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Unified front-door search for the `/hulp` hub — one box spanning people (Structuur) and answers (Hulp). Keyword-ranked, interleaved results; replaces `<UnifiedSearchBar>` + `<HulpSearchInput>`. Selecting a result smooth-scrolls to the relevant hub section (tracer; the person side-panel + answer accordion land in later phases).",
      },
    },
  },
} satisfies Meta<typeof HubSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hero variant — the prominent box, shown on the dark hero band it lives in. */
export const Hero: Story = {
  args: { variant: "hero", className: "max-w-[480px]" },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep-dark p-10">
        <Story />
      </div>
    ),
  ],
};

/** Hero variant with the results dropdown open (typed "in" → people + answers). */
export const HeroWithResults: Story = {
  ...Hero,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Zoek een persoon of hulpvraag");
    await userEvent.click(input);
    await userEvent.type(input, "in");
  },
};

/** Compact variant — the repeated search inside the sticky section nav. */
export const Nav: Story = {
  args: { variant: "nav", className: "max-w-[260px]" },
  decorators: [
    (Story) => (
      <div className="bg-cream-deep p-6">
        <Story />
      </div>
    ),
  ],
};

/**
 * Nav variant with results open — the dropdown widens beyond the compact input
 * to a comfortable reading width (right-aligned) instead of inheriting the
 * narrow input width.
 */
export const NavWithResults: Story = {
  ...Nav,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Zoek een persoon of hulpvraag");
    await userEvent.click(input);
    await userEvent.type(input, "in");
  },
};

/** No-match empty state. */
export const NoResults: Story = {
  ...Hero,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Zoek een persoon of hulpvraag");
    await userEvent.click(input);
    await userEvent.type(input, "zzzzz");
  },
};
