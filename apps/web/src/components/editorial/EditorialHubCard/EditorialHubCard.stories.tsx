import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NavGlyph } from "../NavGlyph/NavGlyph";
import { EditorialHubCard } from "./EditorialHubCard";

const meta = {
  title: "Features/Editorial/EditorialHubCard",
  component: EditorialHubCard,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The uniform 16:9 image-top card of a landing-page nav hub (7j3). Shared across the /jeugd nav hub and (later) /club. **news** = greyscale→hover cover photo + jersey-deep tag pill; **nav** = jersey-deep glyph panel (Phosphor-fill) + cream tag pill, no photo. Both share border-2 ink + shadow-paper + canonical press-down.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[22rem] max-w-full p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialHubCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** News variant — greyscale cover photo (resolves to colour on hover) + jersey-deep tag. */
export const News: Story = {
  args: {
    variant: "news",
    href: "/nieuws/u15-wint-in-stijl",
    tag: "Jeugd",
    title: "U15 wint in stijl tegen Wolvertem",
    arrowText: "Lees meer",
    imageUrl: "/images/youth-trainers.jpg",
    imageAlt: "U15-spelers vieren een doelpunt",
  },
};

/** News variant with no cover — falls back to the cream-deep panel, pill still shown. */
export const NewsNoImage: Story = {
  args: {
    variant: "news",
    href: "/nieuws/inschrijvingen-zomerstage",
    tag: "Jeugd",
    title: "Inschrijvingen zomerstage geopend",
    arrowText: "Lees meer",
  },
};

/** Nav variant — jersey-deep glyph panel + cream tag, no photo. */
export const Nav: Story = {
  args: {
    variant: "nav",
    href: "/jeugd#visie",
    tag: "Visie",
    title: "Onze jeugdvisie",
    arrowText: "Ontdek",
    icon: <NavGlyph name="Eye" />,
  },
};

/** Nav variant with a different glyph and a longer title (clamps to 2 lines). */
export const NavTrainingen: Story = {
  args: {
    variant: "nav",
    href: "/nieuws/prosoccerdata",
    tag: "Praktisch",
    title: "Trainingen & ProSoccerData",
    arrowText: "Meer info",
    icon: <NavGlyph name="SoccerBall" />,
  },
};

/** Nav variant with no CMS tag — the pill is omitted entirely. */
export const NavNoTag: Story = {
  args: {
    variant: "nav",
    href: "/club/organigram",
    tag: "",
    title: "Organigram",
    arrowText: "Bekijk",
    icon: <NavGlyph name="TreeStructure" />,
  },
};
