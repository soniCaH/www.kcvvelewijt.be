import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { ROUND_AVATAR_SIZES, RoundAvatar } from "./RoundAvatar";

const PHOTO = fixtureImage("staff-portrait", 0);

const meta = {
  title: "UI/RoundAvatar",
  component: RoundAvatar,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'The one round avatar (#3331, decision #3304). Three sizes — 24 / 40 / 64 — one ring rule (1px ink at 24, 2px ink at 40 and 64) and one no-photo answer: a monogram, jersey-deep glyph on cream-soft, never the drawn figure. Letters come from `initials()`: first + last token for a full name, one letter for a first name only. `glyph` swaps the letters for a "+N" count or a "+" vacancy (`dashed`) that sits among avatars and takes their ring, fill and size.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoundAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { size: 40, name: "Luc Boons", photoUrl: PHOTO },
  argTypes: {
    size: { control: "radio", options: [...ROUND_AVATAR_SIZES] },
  },
};

export const Photo24: Story = {
  args: { size: 24, name: "Luc Boons", photoUrl: PHOTO },
};
export const Photo40: Story = {
  args: { size: 40, name: "Luc Boons", photoUrl: PHOTO },
};
export const Photo64: Story = {
  args: { size: 64, name: "Luc Boons", photoUrl: PHOTO },
};

export const Monogram24: Story = { args: { size: 24, name: "Luc Boons" } };
export const Monogram40: Story = { args: { size: 40, name: "Luc Boons" } };
export const Monogram64: Story = { args: { size: 64, name: "Luc Boons" } };

// One letter: only a first name is known (article subjects pass `firstName`).
export const FirstNameOnly: Story = {
  args: { size: 40, name: "Anouk" },
};

// A "+N" count and a "+" vacancy take the ring, fill and size of the avatar
// beside them.
export const CountAndVacancy: Story = {
  args: { size: 40, name: "Luc Boons" },
  render: () => (
    <div className="flex items-center gap-4">
      <RoundAvatar size={40} name="Luc Boons" />
      <RoundAvatar size={40} glyph="+2" />
      <RoundAvatar size={40} glyph="+" dashed />
    </div>
  ),
};

// Every size × photo / monogram on one row each.
export const Matrix: Story = {
  args: { size: 40, name: "Luc Boons" },
  render: () => (
    <div className="flex flex-col gap-4">
      {[PHOTO, null].map((photoUrl) => (
        <div key={photoUrl ?? "monogram"} className="flex items-end gap-6">
          {ROUND_AVATAR_SIZES.map((size) => (
            <RoundAvatar
              key={size}
              size={size}
              name="Luc Boons"
              photoUrl={photoUrl}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};
