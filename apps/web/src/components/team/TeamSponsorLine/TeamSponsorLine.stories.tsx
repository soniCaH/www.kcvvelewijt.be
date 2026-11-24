import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamSponsorLine } from "./TeamSponsorLine";

const garage = { id: "s-1", name: "Garage X", url: "https://garagex.example" };
const bakker = {
  id: "s-2",
  name: "Bakkerij Y",
  url: "https://bakkerij.example",
};
const slager = { id: "s-3", name: "Slagerij Z", url: undefined };

const meta = {
  title: "Features/Teams/TeamSponsorLine",
  component: TeamSponsorLine,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
  args: { teamSlug: "kcvv-elewijt-u13", sponsors: [garage] },
} satisfies Meta<typeof TeamSponsorLine>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One Sponsor with a website: a link in a new tab. */
export const One: Story = {};

/** Two names join with " en ". */
export const Two: Story = {
  args: { sponsors: [garage, bakker] },
};

/** Three or more: commas, then " en " before the last. */
export const Three: Story = {
  args: { sponsors: [garage, bakker, slager] },
};

/** A Sponsor without a website is named in plain text, never a dead link. */
export const NoUrl: Story = {
  args: { sponsors: [slager] },
};

/** An empty list renders nothing: the team page looks as it did before. */
export const Empty: Story = {
  args: { sponsors: [] },
};

/** Long names at 320 px: the line wraps cleanly and never overflows. */
export const Wraps320: Story = {
  args: {
    sponsors: [
      {
        id: "s-4",
        name: "Garage Janssens & Zonen Autoservice",
        url: "https://janssens.example",
      },
      {
        id: "s-5",
        name: "Bakkerij en Banketbakkerij Vermeulen",
        url: "https://vermeulen.example",
      },
      {
        id: "s-6",
        name: "Slagerij Peeters-Van den Broeck",
        url: undefined,
      },
      {
        id: "s-7",
        name: "Elektro De Smet",
        url: "https://desmet.example",
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="w-[320px] overflow-hidden outline outline-1 outline-dashed">
        <Story />
      </div>
    ),
  ],
};
