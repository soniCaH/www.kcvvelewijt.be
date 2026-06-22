import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, userEvent, waitFor } from "storybook/test";
import { OrganigramHero } from "./OrganigramHero";
import {
  HUB_SEARCH_MEMBERS,
  HUB_SEARCH_PATHS,
} from "../HubSearch/hub-search.fixture";

const meta = {
  title: "Features/Organigram/OrganigramHero",
  component: OrganigramHero,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The `/hulp` hub hero (lock 7o1): a jersey-deep-dark roster-spotlight band with the embedded `<HubSearch>`, audience chips → Hulp, and a cream taped structure-index artefact (positions / people / departments — counts only, no faces).",
      },
    },
  },
  args: {
    members: HUB_SEARCH_MEMBERS,
    responsibilityPaths: HUB_SEARCH_PATHS,
    structureIndex: { posities: 23, mensen: 30, afdelingen: 2 },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto max-w-[70rem] p-6 sm:p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrganigramHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A small club (fewer positions) still renders a coherent index. */
export const SmallStructure: Story = {
  args: { structureIndex: { posities: 8, mensen: 11, afdelingen: 2 } },
};

/**
 * Search dropdown open — verifies the results overflow the band freely (the
 * hero no longer sets `overflow-hidden`, which previously clipped them).
 */
export const SearchOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Zoek een persoon of hulpvraag");
    await userEvent.click(input);
    await userEvent.type(input, "in");
    // Wait for the debounced + semantic search to settle before the screenshot
    // — otherwise the VR capture races the "Bezig met zoeken…" shimmer (the
    // flake that produced the search-open diff). The `role="status"` region
    // announces the settled count.
    await waitFor(
      () => {
        const status = canvas.getByRole("status");
        if (!/resulta(at|ten)/.test(status.textContent ?? "")) {
          throw new Error("OrganigramHero search not settled");
        }
      },
      { timeout: 5000 },
    );
  },
};
