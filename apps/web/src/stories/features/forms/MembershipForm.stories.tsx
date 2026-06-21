import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MembershipForm } from "@/components/club/MembershipForm/MembershipForm";

/**
 * Membership-intake form for `/club/word-lid`, built from the locked Phase 2.A.4
 * form atoms inside a <ClippedCard> + <StampBadge> shell. Role selector reveals
 * role-specific fields; a minor birth date reveals the parent-consent block.
 *
 * `defaultRole` / `defaultBirthDate` exist only to render the conditional
 * branches statically for docs + visual regression — the live form starts empty.
 */
const meta: Meta<typeof MembershipForm> = {
  title: "Features/Forms/MembershipForm",
  component: MembershipForm,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[760px] max-w-full p-12">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty form — base fields, no role selected yet. */
export const Default: Story = {};

/** Senior player — reveals the medical-certificate acknowledgment. */
export const Speler: Story = {
  args: { defaultRole: "speler" },
};

/** Volunteer — base fields only, no medical cert. */
export const Vrijwilliger: Story = {
  args: { defaultRole: "vrijwilliger" },
};

/** Minor youth player — medical cert + parent-consent block both visible. */
export const MinderjarigeJeugdspeler: Story = {
  args: { defaultRole: "jeugdspeler", defaultBirthDate: "2014-05-01" },
};
