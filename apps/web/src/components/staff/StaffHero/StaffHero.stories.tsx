import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StaffHero } from "./StaffHero";

const meta = {
  title: "Features/Staff/StaffHero",
  component: StaffHero,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
  decorators: [
    // Near-white page background (matches the real `/staf/[slug]` body) so the
    // cream photo card + ink text read in their true context.
    (Story) => (
      <div className="min-h-screen bg-[var(--color-kcvv-white)] px-4 py-10 md:px-10">
        <div className="mx-auto max-w-[var(--container-wide)]">
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    firstName: { control: "text" },
    lastName: { control: "text" },
    imageUrl: { control: "text", description: "Portrait photo (newsprint)" },
    roles: { control: "object", description: "Role pill labels" },
    email: { control: "text" },
    phone: { control: "text" },
  },
} satisfies Meta<typeof StaffHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full profile — portrait photo, two role pills, email + phone. */
export const WithPhoto: Story = {
  args: {
    firstName: "Marc",
    lastName: "De Coninck",
    imageUrl: "/images/youth-trainers.jpg",
    roles: ["Hoofdtrainer", "A-ploeg"],
    email: "marc@kcvvelewijt.be",
    phone: "+32 478 12 34 56",
  },
};

/** No photo → jersey-deep monogram (initials) in the same framed slot. */
export const MonogramFallback: Story = {
  args: {
    firstName: "Marc",
    lastName: "De Coninck",
    roles: ["Hoofdtrainer", "A-ploeg"],
    email: "marc@kcvvelewijt.be",
  },
};

/** Sparse data — name + single role only (no photo, no contact). */
export const NameAndRoleOnly: Story = {
  args: {
    firstName: "Bea",
    lastName: "Bijstand",
    roles: ["Afgevaardigde"],
  },
};

/** Board member — long single-word last name, contact only, no roles. */
export const ContactOnly: Story = {
  args: {
    firstName: "Greta",
    lastName: "Vandenberghe",
    email: "voorzitter@kcvvelewijt.be",
    phone: "+32 477 00 00 00",
  },
};

/** Mobile viewport — the split collapses to stacked portrait → words. */
export const Mobile: Story = {
  args: {
    firstName: "Marc",
    lastName: "De Coninck",
    imageUrl: "/images/youth-trainers.jpg",
    roles: ["Hoofdtrainer", "A-ploeg"],
    email: "marc@kcvvelewijt.be",
    phone: "+32 478 12 34 56",
  },
  globals: {
    viewport: { value: "kcvvMobile" },
  },
};
