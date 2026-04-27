/**
 * MobileMenu Component Stories
 * Off-canvas mobile navigation with submenu expansion and active states
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { mockSeniorTeams, mockYouthTeams } from "../teamNav.mocks";
import { MobileMenu } from "./MobileMenu";

const meta = {
  title: "Layout/MobileMenu",
  component: MobileMenu,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Off-canvas mobile navigation panel (280px wide, dark background). Slides in from the left when open. Supports nested submenus and active state highlighting via pathname/search params.",
      },
    },
  },
  globals: {
    viewport: { value: "mobile1" },
  },
  args: {
    isOpen: true,
    onClose: fn(),
    seniorTeams: mockSeniorTeams,
    youthTeams: mockYouthTeams,
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof MobileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const rootNavigation = {
  nextjs: {
    navigation: {
      pathname: "/",
    },
  },
};

/**
 * Menu hidden — panel translated off-screen, no backdrop visible
 */
export const Closed: Story = {
  args: {
    isOpen: false,
  },
  parameters: rootNavigation,
};

/**
 * Menu fully open — panel visible, no item active
 */
export const Open: Story = {
  parameters: rootNavigation,
};

/**
 * A-Ploeg submenu expanded — play clicks the A-Ploeg toggle button.
 * Override seniorTeams to a single team so the assertion stays unambiguous
 * (each senior team renders its own "Spelers & Staff" link).
 */
export const OpenWithAPloegsSubmenu: Story = {
  args: {
    seniorTeams: mockSeniorTeams.slice(0, 1),
  },
  parameters: rootNavigation,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: /A-Ploeg/i });
    await userEvent.click(toggle);
    expect(
      canvas.getByRole("link", { name: /Spelers & Staff/i }),
    ).toBeInTheDocument();
  },
};

/**
 * Jeugd submenu expanded — play clicks the Jeugd toggle button (13 children)
 */
export const OpenWithJeugdSubmenu: Story = {
  parameters: rootNavigation,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: /Jeugd/i });
    await userEvent.click(toggle);
    expect(canvas.getByRole("link", { name: /U21/i })).toBeInTheDocument();
  },
};

/**
 * Active top-level link — Nieuws item has green left border
 */
export const OpenWithActiveLink: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/nieuws",
      },
    },
  },
};

/**
 * Active child link — A-Ploeg submenu expanded, "Spelers & Staff" highlighted.
 * Override seniorTeams to a single team so the assertion stays unambiguous.
 */
export const OpenWithActiveChildLink: Story = {
  args: {
    seniorTeams: mockSeniorTeams.slice(0, 1),
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/ploegen/a-ploeg",
        query: { tab: "opstelling" },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: /A-Ploeg/i });
    await userEvent.click(toggle);
    expect(
      canvas.getByRole("link", { name: /Spelers & Staff/i }),
    ).toBeInTheDocument();
  },
};
