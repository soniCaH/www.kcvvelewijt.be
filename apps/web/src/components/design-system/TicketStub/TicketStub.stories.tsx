import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TicketStub } from "./TicketStub";

const meta = {
  title: "UI/TicketStub",
  component: TicketStub,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge relative h-48 w-80 border p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TicketStub>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { label: "STAMNR.", value: "55", position: "inline", rotation: 0 },
};

export const Stamnummer: Story = {
  args: { label: "STAMNR.", value: "55", position: "inline" },
};

export const Sinds: Story = {
  args: { label: "SINDS", value: "1909", position: "inline" },
};

export const APloeg: Story = {
  args: { label: "A-PLOEG", value: "26/27", position: "inline" },
};

export const Nieuw: Story = {
  args: { label: "NIEUW", value: "!", position: "inline" },
};

export const OverlayTopRight: Story = {
  args: {
    label: "STAMNR.",
    value: "55",
    position: "overlay-tr",
    rotation: 4,
  },
};

export const OverlayBottomLeft: Story = {
  args: {
    label: "SINDS",
    value: "1909",
    position: "overlay-bl",
    rotation: -3,
  },
};

export const RotationSamples: Story = {
  args: { label: "STAMNR.", value: "55" },
  render: () => (
    <div className="flex items-center gap-6">
      <TicketStub label="STAMNR." value="55" rotation={-3} />
      <TicketStub label="SINDS" value="1909" rotation={0} />
      <TicketStub label="A-PLOEG" value="26/27" rotation={4} />
    </div>
  ),
};

export const StubGrid: Story = {
  args: { label: "STAMNR.", value: "55" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <TicketStub label="STAMNR." value="55" />
      <TicketStub label="SINDS" value="1909" />
      <TicketStub label="A-PLOEG" value="26/27" />
      <TicketStub label="NIEUW" value="!" />
    </div>
  ),
};
