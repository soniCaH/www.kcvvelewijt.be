import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ALaCarteList, PackageContact } from "./PackageExplainerTail";

// The lower part of `<PackageExplainer>`, rendered alone: the VR harness clips
// every baseline to the viewport height, so on the whole block these parts sit
// below the first screen and no baseline would show them.
const meta = {
  title: "Features/Sponsors/PackageExplainerTail",
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto w-full max-w-[var(--container-index)] px-4 pb-10 md:px-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** "Of kies apart": the four groups of loose packages. */
export const OfKiesApart: Story = { render: () => <ALaCarteList /> };

/** The closing line, the role and the address: what the page renders. */
export const Contact: Story = { render: () => <PackageContact /> };

/** With a named contact person. */
export const ContactWithName: Story = {
  render: () => <PackageContact contactName="An Peeters" />,
};
