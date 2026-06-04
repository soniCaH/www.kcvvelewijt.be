import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { KalenderFilterBar } from "./KalenderFilterBar";

const meta = {
  title: "Features/Calendar/KalenderFilterBar",
  component: KalenderFilterBar,
  parameters: { layout: "fullscreen" },
  // No `vr` tag yet: the kalender surface visual (field + chip treatment) is
  // locked at the Phase 3 design gate (#1993), so baselining now would capture a
  // provisional render that Phase 3/4 rebases. VR adoption for the kalender
  // surface (this bar + <CalendarWidget>, both currently non-VR) lands with the
  // Phase 3/4 lock — see PR #1992 notes.
  tags: ["autodocs"],
  // The filter bar lives on the light `/kalender` page; render it on that field
  // so the ink chip text/outlines are evaluated in context (vs `<EventFilterBar>`,
  // which renders on the dark `/evenementen` field).
  decorators: [
    (Story) => (
      <div className="bg-gray-100 p-6">
        <Story />
      </div>
    ),
  ],
  args: { onSelect: fn() },
} satisfies Meta<typeof KalenderFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — "Alles" selected, no type filter applied. */
export const Alles: Story = {
  args: { selected: "all" },
};

/** Matches — the primary calendar category, card-red fill (#1992). */
export const Wedstrijden: Story = {
  args: { selected: "Wedstrijden" },
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
