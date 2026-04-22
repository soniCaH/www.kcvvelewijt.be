/**
 * SponsorLogo Component Stories
 * Pure sponsor logo image at various sizes
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SponsorLogo } from "./SponsorLogo";
import { mockSponsors } from "../Sponsors.mocks";

const s1 = mockSponsors[0] ?? {
  id: "1",
  name: "Sponsor One",
  logo: "https://placehold.co/200x133/4B9B48/FFFFFF?text=Sponsor+1",
  url: "https://example.com",
};

const s3 = mockSponsors[2] ?? {
  id: "3",
  name: "Sponsor Three",
  logo: "https://placehold.co/200x133/4B9B48/FFFFFF?text=Sponsor+3",
};

const meta = {
  title: "Features/Sponsors/SponsorLogo",
  component: SponsorLogo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Bare sponsor logo image at a configurable size. Wraps in a link when a `url` is provided. Has no card chrome or hover overlay — use SponsorCard for those.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: { control: "radio", options: ["xs", "sm", "md", "lg"] },
  },
} satisfies Meta<typeof SponsorLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Medium logo (default). */
export const Default: Story = {
  args: {
    name: s1.name,
    logo: s1.logo,
    size: "md",
  },
};

/** Logo wrapped in a link — click leads to sponsor website. */
export const WithLink: Story = {
  args: {
    name: s1.name,
    logo: s1.logo,
    url: s1.url,
    size: "md",
  },
};

/** Sponsor without a URL — rendered as a plain image. */
export const NoUrl: Story = {
  args: {
    name: s3.name,
    logo: s3.logo,
    size: "md",
  },
};

/** All four sizes side by side. */
export const SizeVariants: Story = {
  args: {
    name: s1.name,
    logo: s1.logo,
    size: "md",
  },
  render: ({ name, logo }) => (
    <div className="flex items-end gap-6">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <SponsorLogo name={name} logo={logo} size={size} />
          <span className="text-xs text-gray-500">{size}</span>
        </div>
      ))}
    </div>
  ),
};

/** Logo on a dark background — verify contrast. */
export const DarkBackground: Story = {
  args: {
    name: s1.name,
    logo: s1.logo,
    size: "md",
  },
  decorators: [
    (Story) => (
      <div className="rounded bg-[#1E2024] p-6">
        <Story />
      </div>
    ),
  ],
};
