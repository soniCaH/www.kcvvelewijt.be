/**
 * Privacy Page Redesign — Visual Prototype
 *
 * Brings the /privacy page into the site design language: compact PageHero
 * followed by a single gray-100 prose section with diagonal transitions.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHero } from "@/components/design-system/PageHero/PageHero";
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";

const meta = {
  title: "Pages/Privacy Redesign",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Redesigned: Story = {
  render: () => {
    const sections: SectionConfig[] = [
      {
        key: "hero",
        bg: "kcvv-black",
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        content: (
          <PageHero
            size="compact"
            gradient="dark"
            label="Juridisch"
            headline="Privacyverklaring"
            body="Hoe wij omgaan met jouw gegevens."
          />
        ),
        transition: { type: "diagonal", direction: "right", overlap: "full" },
      },
      {
        key: "content",
        bg: "gray-100",
        content: (
          <div className="prose prose-gray max-w-2xl mx-auto px-4 md:px-10">
            <h2>Inleiding</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>

            <h2>Welke gegevens</h2>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
              cupidatat non proident, sunt in culpa qui officia deserunt mollit
              anim id est laborum. Sed ut perspiciatis unde omnis iste natus
              error sit voluptatem accusantium doloremque laudantium.
            </p>

            <h2>Hoe wij ze gebruiken</h2>
            <p>
              Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et
              quasi architecto beatae vitae dicta sunt explicabo. Nemo enim
              ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit,
              sed quia consequuntur magni dolores eos qui ratione voluptatem
              sequi nesciunt.
            </p>

            <h2>Jouw rechten</h2>
            <p>
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet,
              consectetur, adipisci velit, sed quia non numquam eius modi
              tempora incidunt ut labore et dolore magnam aliquam quaerat
              voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem
              ullam corporis suscipit laboriosam.
            </p>

            <h2>Contact</h2>
            <p>
              Quis autem vel eum iure reprehenderit qui in ea voluptate velit
              esse quam nihil molestiae consequatur, vel illum qui dolorem eum
              fugiat quo voluptas nulla pariatur. At vero eos et accusamus et
              iusto odio dignissimos ducimus qui blanditiis praesentium
              voluptatum deleniti atque corrupti.
            </p>
          </div>
        ),
      },
    ];

    return <SectionStack sections={sections} />;
  },
};
