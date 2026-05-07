import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  NavDropdown,
  NavDropdownProvider,
  type NavDropdownGroup,
  type NavDropdownItem,
} from "./NavDropdown";

/**
 * `<NavDropdown>` is normally hover-driven. For VR coverage we pre-open a
 * panel by giving the dropdown an explicit `id` and wrapping it in a
 * `<NavDropdownProvider>` whose `defaultOpenId` matches.
 */
const STORY_ID = "story-dropdown";

const meta = {
  title: "UI/NavDropdown",
  component: NavDropdown,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
    // Pin VR baselines to desktop — the dropdown is desktop-only (mobile
    // is covered by `<NavTakeover>`).
    vr: { viewports: ["desktop"] },
  },
} satisfies Meta<typeof NavDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const teamsItems: NavDropdownItem[] = [
  { label: "Info", href: "/ploegen/a" },
  { label: "Spelers & Staff", href: "/ploegen/a?tab=opstelling" },
  { label: "Wedstrijden", href: "/ploegen/a?tab=wedstrijden" },
  { label: "Stand", href: "/ploegen/a?tab=klassement" },
];

const jeugdItems: NavDropdownItem[] = [
  { label: "U6", href: "/ploegen/u6" },
  { label: "U7", href: "/ploegen/u7" },
  { label: "U8", href: "/ploegen/u8" },
  { label: "U9", href: "/ploegen/u9" },
  { label: "U10", href: "/ploegen/u10" },
  { label: "U11", href: "/ploegen/u11" },
  { label: "U12", href: "/ploegen/u12" },
  { label: "U13", href: "/ploegen/u13" },
  { label: "U15", href: "/ploegen/u15" },
  { label: "U17", href: "/ploegen/u17" },
];

const deClubGroups: NavDropdownGroup[] = [
  {
    label: "Wie we zijn",
    items: [
      { label: "Geschiedenis", href: "/club/geschiedenis" },
      { label: "Organigram", href: "/club/organigram" },
      { label: "Bestuur", href: "/club/bestuur" },
      { label: "Jeugdbestuur", href: "/club/jeugdbestuur" },
      { label: "KCVV Angels", href: "/club/angels" },
      { label: "KCVV Ultras", href: "/club/ultras" },
    ],
  },
  {
    label: "Praktisch",
    items: [
      { label: "Praktische Info", href: "/club/inschrijven" },
      { label: "Word vrijwilliger", href: "/club/vrijwilliger" },
      { label: "Cashless clubkaart", href: "/club/cashless" },
      { label: "Contact", href: "/club/contact" },
      { label: "Downloads", href: "/club/downloads" },
    ],
  },
];

interface FrameProps {
  open: boolean;
  children: React.ReactNode;
}

/**
 * Story frame: page-shaped surface with a small SiteHeader-like nav row.
 * When `open` is true, the provider pre-opens the wrapped dropdown via
 * `defaultOpenId`.
 */
const Frame = ({ open, children }: FrameProps) => (
  <div className="bg-cream min-h-[480px] p-8">
    <nav>
      <ul className="m-0 flex list-none items-center justify-end gap-8 py-2">
        <NavDropdownProvider defaultOpenId={open ? STORY_ID : undefined}>
          {children}
        </NavDropdownProvider>
      </ul>
    </nav>
    <div className="mt-16 opacity-40">
      <p className="text-ink-muted font-mono text-[11px] tracking-[0.12em] uppercase">
        De club · meer dan een eeuw
      </p>
      <h2 className="font-display text-ink mt-2 text-[36px] leading-tight font-black italic">
        Een club met een <em className="text-jersey-deep">eigen plek</em>
      </h2>
      <p className="text-ink-soft mt-3 max-w-[580px] text-sm">
        KCVV Elewijt speelt al meer dan honderd jaar in het amateurvoetbal.
      </p>
    </div>
  </div>
);

/** Closed default — only the trigger renders, no panel. */
export const Closed: Story = {
  args: {
    label: "De club",
    href: "/club",
    itemGroups: deClubGroups,
  },
  render: (args) => (
    <Frame open={false}>
      <NavDropdown {...args} id={STORY_ID} />
    </Frame>
  ),
};

/** Narrow panel for Teams (4 fixed children). */
export const OpenNarrowTeams: Story = {
  name: "Open / Narrow / Teams",
  args: {
    label: "A-Ploeg",
    href: "/ploegen/a",
    items: teamsItems,
  },
  render: (args) => (
    <Frame open>
      <NavDropdown {...args} id={STORY_ID} />
    </Frame>
  ),
};

/** Narrow panel for Jeugd (10 youth age groups). */
export const OpenNarrowJeugd: Story = {
  name: "Open / Narrow / Jeugd",
  args: {
    label: "Jeugd",
    href: "/jeugd",
    items: jeugdItems,
  },
  render: (args) => (
    <Frame open>
      <NavDropdown {...args} id={STORY_ID} />
    </Frame>
  ),
};

/** Wide panel for De club (2 groups: Wie we zijn / Praktisch). */
export const OpenWideDeClub: Story = {
  name: "Open / Wide / De club",
  args: {
    label: "De club",
    href: "/club",
    itemGroups: deClubGroups,
  },
  render: (args) => (
    <Frame open>
      <NavDropdown {...args} id={STORY_ID} />
    </Frame>
  ),
};

/** Wide panel with Geschiedenis as the active item (chevron + jersey-bright). */
export const WithActiveItem: Story = {
  name: "Open / Wide / Active item",
  args: {
    label: "De club",
    href: "/club",
    triggerActive: true,
    itemGroups: [
      {
        label: "Wie we zijn",
        items: (deClubGroups[0]?.items ?? []).map((item) =>
          item.label === "Geschiedenis" ? { ...item, active: true } : item,
        ),
      },
      deClubGroups[1] ?? { label: "Praktisch", items: [] },
    ],
  },
  render: (args) => (
    <Frame open>
      <NavDropdown {...args} id={STORY_ID} />
    </Frame>
  ),
};

/**
 * Wide panel with Organigram in its hover state. VR uses `parameters.pseudo`
 * (storybook-addon-pseudo-states) to force `:hover` on the second menu item
 * so the bullet/text colour shift is captured statically.
 */
export const WithHoveredItem: Story = {
  name: "Open / Wide / Hovered item",
  args: {
    label: "De club",
    href: "/club",
    itemGroups: deClubGroups,
  },
  parameters: {
    pseudo: {
      hover: '[role="menuitem"][href="/club/organigram"]',
    },
  },
  render: (args) => (
    <Frame open>
      <NavDropdown {...args} id={STORY_ID} />
    </Frame>
  ),
};
