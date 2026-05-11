/**
 * Sponsors Component Stories
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Sponsors } from "./Sponsors";
import { mockSponsors } from "./Sponsors.mocks";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Sponsors/SponsorsGrid",
  component: Sponsors,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Sponsors grid component for displaying sponsor logos with hover effects. Supports light/dark themes, variable column counts, and optional links to sponsor websites.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Sponsors>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default sponsors grid with 4 columns (light theme)
 */
export const Default: Story = {
  args: {
    sponsors: mockSponsors,
  },
};

/**
 * Dark theme variant (for use in PageFooter or dark sections)
 */
export const DarkTheme: Story = {
  args: {
    sponsors: mockSponsors,
    variant: "dark",
  },
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story:
          "Dark theme variant with white text and inverted logos, suitable for dark backgrounds like the PageFooter.",
      },
    },
  },
};

/**
 * 2-column grid (mobile-friendly)
 */
export const TwoColumns: Story = {
  args: {
    sponsors: mockSponsors.slice(0, 4),
    columns: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Narrow grid with 2 columns, ideal for mobile layouts or sidebar placements.",
      },
    },
  },
};

/**
 * 3-column grid
 */
export const ThreeColumns: Story = {
  args: {
    sponsors: mockSponsors.slice(0, 6),
    columns: 3,
  },
  parameters: {
    docs: {
      description: {
        story: "Medium-width grid with 3 columns.",
      },
    },
  },
};

/**
 * 5-column grid
 */
export const FiveColumns: Story = {
  args: {
    sponsors: mockSponsors,
    columns: 5,
  },
  parameters: {
    docs: {
      description: {
        story: "Wide grid with 5 columns for displaying sponsors.",
      },
    },
  },
};

/**
 * 6-column grid (maximum density)
 */
export const SixColumns: Story = {
  args: {
    sponsors: mockSponsors.concat(mockSponsors).slice(0, 12),
    columns: 6,
  },
  parameters: {
    docs: {
      description: {
        story: "Maximum density grid with 6 columns.",
      },
    },
  },
};

/**
 * Custom title and description
 */
export const CustomText: Story = {
  args: {
    sponsors: mockSponsors,
    title: "Our Partners",
    description:
      "Thank you to our amazing partners who make KCVV Elewijt possible.",
  },
  parameters: {
    docs: {
      description: {
        story: "Custom title and description text.",
      },
    },
  },
};

/**
 * Without "View All" link
 */
export const WithoutViewAll: Story = {
  args: {
    sponsors: mockSponsors,
    showViewAll: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sponsors grid without the "View All" link.',
      },
    },
  },
};

/**
 * Custom "View All" link
 */
export const CustomViewAllLink: Story = {
  args: {
    sponsors: mockSponsors,
    viewAllHref: "/partners",
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom URL for the "View All" link.',
      },
    },
  },
};

/**
 * Single sponsor
 */
export const SingleSponsor: Story = {
  args: {
    sponsors: [mockSponsors[0]],
  },
  parameters: {
    docs: {
      description: {
        story: "Grid with only one sponsor.",
      },
    },
  },
};

/**
 * Many sponsors (20 items)
 */
export const ManySponsors: Story = {
  args: {
    sponsors: Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Sponsor ${i + 1}`,
      logo: fixtureImage("sponsor-logo", i),
      url: i % 3 === 0 ? `https://example.com/sponsor${i + 1}` : undefined,
    })),
    columns: 4,
  },
  parameters: {
    docs: {
      description: {
        story: "Grid with many sponsors to demonstrate scrolling and layout.",
      },
    },
  },
};

/**
 * Empty state (returns null)
 */
export const Empty: Story = {
  args: {
    sponsors: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          "When no sponsors are provided, the component returns null and renders nothing.",
      },
    },
  },
};

/**
 * Homepage usage example (light theme, 4 columns)
 */
export const HomepageExample: Story = {
  args: {
    sponsors: mockSponsors,
    title: "Onze sponsors",
    description:
      "KCVV Elewijt wordt mede mogelijk gemaakt door onze trouwe sponsors.",
    columns: 4,
    variant: "light",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Example of how the Sponsors component would appear on the homepage with light theme.",
      },
    },
  },
};

/**
 * Footer usage example (dark theme, 4 columns)
 */
export const FooterExample: Story = {
  args: {
    sponsors: mockSponsors,
    title: "Onze sponsors",
    description:
      "KCVV Elewijt wordt mede mogelijk gemaakt door onze trouwe sponsors.",
    columns: 4,
    variant: "dark",
  },
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story:
          "Example of how the Sponsors component would appear in the PageFooter with dark theme and inverted logos.",
      },
    },
  },
};
