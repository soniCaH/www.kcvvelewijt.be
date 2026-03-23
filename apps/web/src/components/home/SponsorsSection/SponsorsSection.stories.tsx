import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionHeader } from "@/components/design-system";
import { Sponsors } from "@/components/sponsors/Sponsors";
import { mockSponsors } from "@/components/sponsors/Sponsors.mocks";

/**
 * SponsorsSection is an async server component (fetches from Sanity).
 * This story renders the visual composition using mock data with the
 * dark green background with sponsor logos.
 */
const meta = {
  title: "Features/Homepage/SponsorsSection",
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  render: () => {
    const homepageSponsors = mockSponsors.filter(
      (s) => s.tier === "hoofdsponsor" || s.tier === "sponsor",
    );

    return (
      <section className="bg-kcvv-green-dark py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionHeader
            title="Onze sponsors"
            linkText="Alle partners"
            linkHref="/sponsors"
            variant="dark"
          />
          <Sponsors
            sponsors={homepageSponsors}
            title=""
            description=""
            showViewAll={false}
            variant="dark"
            columns={5}
            className="py-0"
          />
        </div>
      </section>
    );
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
