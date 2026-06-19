import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { EventListItemVM } from "@/lib/repositories/event.repository";
import { EventsBrowser } from "./EventsBrowser";

function ev(
  overrides: Partial<EventListItemVM> & { id: string },
): EventListItemVM {
  return {
    title: "Evenement",
    href: `/evenementen/${overrides.id}`,
    eventType: "Clubevent",
    dateStart: "2026-09-12T18:00:00Z",
    dateEnd: null,
    location: "Sportpark Driesput, Elewijt",
    source: "event",
    ...overrides,
  };
}

const EVENTS: EventListItemVM[] = [
  ev({
    id: "spaghetti-avond",
    title: "Spaghetti-avond",
    eventType: "Clubevent",
    dateStart: "2026-09-12T18:00:00Z",
  }),
  ev({
    id: "supportersreis",
    title: "Supportersreis",
    eventType: "Supportersactiviteit",
    dateStart: "2026-09-20T08:00:00Z",
  }),
  ev({
    id: "jeugdtornooi",
    title: "Jeugdtornooi U13",
    eventType: "Jeugdwerking",
    dateStart: "2026-10-04T10:00:00Z",
  }),
  ev({
    id: "algemene-vergadering",
    title: "Algemene vergadering",
    eventType: "Andere",
    dateStart: "2026-10-18T20:00:00Z",
  }),
];

const meta = {
  title: "Features/Events/EventsBrowser",
  component: EventsBrowser,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs", "vr"],
  // Render on the dark `/evenementen` field so chips, month headers + seams
  // are evaluated against jersey-deep-dark.
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep-dark min-h-screen p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventsBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — "Alles" selected, every upcoming event grouped by month. */
export const Populated: Story = {
  args: { events: EVENTS },
};

/**
 * Filtered-to-zero — "Jeugdwerking" pre-selected against a list with no
 * Jeugdwerking events, so the per-category message + "Toon alles" reset show
 * while the filter row stays visible.
 */
export const FilteredToZero: Story = {
  args: {
    initialSelected: "Jeugdwerking",
    events: EVENTS.filter((event) => event.eventType !== "Jeugdwerking"),
  },
};

/** Empty list — no upcoming events at all: centred message, no filter row. */
export const Empty: Story = {
  args: { events: [] },
};
