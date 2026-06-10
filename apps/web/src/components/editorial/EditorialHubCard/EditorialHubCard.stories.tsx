import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NavGlyph, type NavGlyphName } from "../NavGlyph/NavGlyph";
import {
  EditorialHubCard,
  type EditorialHubCardProps,
} from "./EditorialHubCard";

/**
 * The card's `icon` is a `ReactNode` (so the card stays a server component).
 * Stories expose a serializable `iconName` instead and map it to `<NavGlyph>`
 * in `render`, keeping Storybook args serializable / Controls-friendly.
 */
type StoryArgs = Omit<EditorialHubCardProps, "icon"> & {
  iconName?: NavGlyphName;
};

const meta = {
  title: "Features/Editorial/EditorialHubCard",
  component: EditorialHubCard,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The uniform 16:9 image-top card of a landing-page nav hub (7j3). Shared across the /jeugd nav hub and (later) /club. **news** = newsprint-colour cover photo + jersey-deep tag pill; **nav** = jersey-deep glyph panel (Phosphor-fill) + cream tag pill. Both share border-2 ink + shadow-paper + canonical press-down. (Greyscale→hover is sponsor-logo-only — never news cards.)",
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
  render: ({ iconName, ...args }) => (
    <EditorialHubCard
      {...args}
      icon={iconName ? <NavGlyph name={iconName} /> : undefined}
    />
  ),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** News variant — newsprint-colour cover photo + jersey-deep tag. */
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
    iconName: "Eye",
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
    iconName: "SoccerBall",
  },
};

/** Nav variant with no CMS tag — the pill still renders, just empty (7j3). */
export const NavNoTag: Story = {
  args: {
    variant: "nav",
    href: "/club/organigram",
    tag: "",
    title: "Organigram",
    arrowText: "Bekijk",
    iconName: "TreeStructure",
  },
};
