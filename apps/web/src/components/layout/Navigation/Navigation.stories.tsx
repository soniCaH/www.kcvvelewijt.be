/**
 * Navigation Component Stories
 * Desktop horizontal navigation with active states and dropdown menus
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Navigation } from "./Navigation";

const meta = {
  title: "Layout/Navigation",
  component: Navigation,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Desktop horizontal navigation bar with dropdown menus and active state management. Active state derives from the current pathname and search params (mocked via Storybook's Next.js adapter).",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-kcvv-green-dark p-4">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof Navigation>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Home page — no item active (root path, Home link has underline)
 */
export const Default: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
};

/**
 * Nieuws page — Nieuws link underlined active
 */
export const OnNews: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/nieuws",
      },
    },
  },
};

/**
 * Team page — A-Ploeg parent highlighted (no tab)
 */
export const OnTeamPage: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/ploegen/a-ploeg",
      },
    },
  },
};

/**
 * Team page with tab — child "Spelers & Staff" active inside A-Ploeg dropdown
 */
export const OnTeamTab: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/ploegen/a-ploeg",
        query: { tab: "opstelling" },
      },
    },
  },
};

/**
 * A-Ploeg dropdown open — hover triggers the 4-item dropdown
 */
export const DropdownOpenAPloegs: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.queryByRole("link", { name: /Spelers & Staff/i }),
    ).not.toBeInTheDocument();
    const trigger = canvas.getByRole("link", { name: /A-Ploeg/i });
    await userEvent.hover(trigger);
    expect(
      canvas.getByRole("link", { name: /Spelers & Staff/i }),
    ).toBeInTheDocument();
  },
};

/**
 * Jeugd dropdown open — hover triggers the 13-item dropdown
 */
export const DropdownOpenJeugd: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.queryByRole("link", { name: /U21/i }),
    ).not.toBeInTheDocument();
    const trigger = canvas.getByRole("link", { name: /Jeugd/i });
    await userEvent.hover(trigger);
    expect(canvas.getByRole("link", { name: /U21/i })).toBeInTheDocument();
  },
};

/**
 * De Club dropdown open — hover triggers the 8-item dropdown (right-aligned)
 */
export const DropdownOpenDeClub: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.queryByRole("link", { name: /Organigram/i }),
    ).not.toBeInTheDocument();
    const trigger = canvas.getByRole("link", { name: /De club/i });
    await userEvent.hover(trigger);
    expect(
      canvas.getByRole("link", { name: /Organigram/i }),
    ).toBeInTheDocument();
  },
};
