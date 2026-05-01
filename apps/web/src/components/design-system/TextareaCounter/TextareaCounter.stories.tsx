import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextareaCounter } from "./TextareaCounter";

const meta: Meta<typeof TextareaCounter> = {
  title: "UI/TextareaCounter",
  component: TextareaCounter,
  tags: ["autodocs", "vr"],
  parameters: {
    docs: {
      description: {
        component:
          "Mono `current/max` digits anchored to the bottom-right corner of a `<Textarea>`. Phase 2.A.4 form-atom primitive — color shifts to `text-alert` when `current > max`. Always rendered inside a `position: relative` wrapper.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="border-ink/30 relative h-32 w-80 border-2 bg-white p-3">
        <p className="font-body text-ink/40 text-sm italic">
          Beschrijf hier je vraag…
        </p>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithinLimit: Story = {
  args: { current: 58, max: 240 },
};

export const NearLimit: Story = {
  args: { current: 220, max: 240 },
};

export const AtLimit: Story = {
  args: { current: 240, max: 240 },
};

export const OverLimit: Story = {
  args: { current: 247, max: 240 },
};
