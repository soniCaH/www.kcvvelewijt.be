import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionHeader } from "@/components/design-system";
import { Sponsors } from "@/components/sponsors/Sponsors";
import { mockSponsors } from "@/components/sponsors/Sponsors.mocks";

/**
 * SponsorsSection is an async server component (fetches from Sanity).
 * This story renders the visual composition using mock data.
 */
const meta = {
  title: "Features/Homepage/SponsorsSection",
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  render: () => (
    <section className="bg-gray-100 py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader
          title="Sponsors"
          linkText="Word sponsor"
          linkHref="/sponsors"
        />
        <Sponsors
          sponsors={mockSponsors}
          title=""
          description=""
          showViewAll={false}
          variant="light"
          columns={5}
          className="py-0"
        />
      </div>
    </section>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
