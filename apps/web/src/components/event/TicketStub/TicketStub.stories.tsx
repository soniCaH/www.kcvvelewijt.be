import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TicketStub } from "./TicketStub";

const meta = {
  title: "Features/Calendar/TicketStub",
  component: TicketStub,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
  args: {
    title: "Spaghetti-avond",
    href: "/evenementen/spaghetti-avond",
    dateStart: "2026-09-12T18:00:00Z",
    eventType: "Clubevent",
    location: "Sportpark Driesput, Elewijt",
  },
} satisfies Meta<typeof TicketStub>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clubevent: Story = {};

export const Supportersactiviteit: Story = {
  args: { eventType: "Supportersactiviteit", title: "Supportersreis" },
};

export const Jeugdwerking: Story = {
  args: { eventType: "Jeugdwerking", title: "Jeugdkamp" },
};

export const Andere: Story = {
  args: { eventType: "Andere", title: "Algemene vergadering" },
};

/** No eventType set — renders the "Andere" render-time fallback (PRD §7). */
export const NoType: Story = {
  args: { eventType: null, title: "Evenement zonder type" },
};

/** Multi-day event — the meta shows the day range instead of a start time. */
export const MultiDay: Story = {
  args: {
    title: "Jeugdkamp",
    eventType: "Jeugdwerking",
    dateStart: "2026-09-14T10:00:00Z",
    dateEnd: "2026-09-16T16:00:00Z",
  },
};

/** All-day event (Brussels-midnight start) — the time is omitted from the meta. */
export const AllDay: Story = {
  // 2026-09-11T22:00Z === 2026-09-12T00:00 in Brussels (CEST).
  args: { title: "Opendeurdag", dateStart: "2026-09-11T22:00:00Z" },
};

export const NoLocation: Story = {
  args: { location: null },
};

/**
 * Documents the hover/focus interaction: the whole ticket tilts + scales and
 * reveals a "Meer details →" cue. The hovered state cannot be captured by the
 * static VR runner (synthetic events don't trigger CSS `:hover`/`group-hover`),
 * and the interaction itself is asserted in the unit test.
 */
export const Hover: Story = {
  parameters: {
    // vr.disable: hovered state can't be triggered by the static screenshot
    //   runner — group-hover/transform need a real pointer (Playwright :hover),
    //   not the synthetic events available in a story play().
    // Repro: render Hover, observe the resting (untilted) capture only.
    // Approved by: design contract 6e2 (hover mirrors <EditorialHero>); resting
    //   states are covered by the other vr stories.
    // Re-evaluate: when a pseudo-state VR helper lands repo-wide.
    vr: { disable: true },
  },
};
