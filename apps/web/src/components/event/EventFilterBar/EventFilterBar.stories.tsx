import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { EventFilterBar } from "./EventFilterBar";

const meta = {
  title: "Features/Events/EventFilterBar",
  component: EventFilterBar,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs", "vr"],
  // The filter bar lives on the dark `/evenementen` page; render it on that
  // field so the cream chip text/outlines are evaluated in context.
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep-dark p-6">
        <Story />
      </div>
    ),
  ],
  args: { onSelect: fn() },
} satisfies Meta<typeof EventFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — "Alles" selected, no type filter applied. */
export const Alles: Story = {
  args: { selected: "all" },
};

export const Clubevent: Story = {
  args: { selected: "Clubevent" },
};

export const Supportersactiviteit: Story = {
  args: { selected: "Supportersactiviteit" },
};

export const Jeugdwerking: Story = {
  args: { selected: "Jeugdwerking" },
};

export const Andere: Story = {
  args: { selected: "Andere" },
};
