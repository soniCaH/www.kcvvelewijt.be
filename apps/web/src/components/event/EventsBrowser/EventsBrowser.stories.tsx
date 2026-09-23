import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, userEvent } from "storybook/test";
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
  parameters: {
    layout: "fullscreen",
  },
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
 * Filtered-to-zero — "Jeugdwerking" pressed against a list with no
 * Jeugdwerking events, so the per-category message + "Toon alles" reset
 * show while the filter row stays visible. Reached via a `play` click
 * rather than a `?type=` seed: `<EventsBrowser>` reads its active facet
 * from `window.location` on mount (#2564 review item 2, so this route stays
 * server-prerendered), which Storybook's `nextjs.navigation` mock — a
 * Next-router shim, not the real browser URL — has no effect on.
 *
 * The click's own `window.history.pushState` is a REAL browser API call —
 * Storybook doesn't hard-navigate between stories in the same test file, so
 * without restoring the URL afterwards this leaks into whatever story runs
 * next in the same page and seeds ITS mount from a stale `?type=`. Confirmed
 * empirically: the `Empty` story's own baseline rendered this story's
 * "Jeugdwerking" copy until the restore was added.
 *
 * The restore is `beforeEach`'s cleanup, which runs when the story is torn
 * down — after the screenshot. Restoring inside `play` is too early: the
 * browser reports the URL change, the component re-reads the URL, and the
 * filter snaps back to "Alles" before the snapshot.
 */
export const FilteredToZero: Story = {
  args: {
    events: EVENTS.filter((event) => event.eventType !== "Jeugdwerking"),
  },
  beforeEach: () => {
    const originalUrl =
      window.location.pathname + window.location.search + window.location.hash;
    return () =>
      window.history.replaceState(window.history.state, "", originalUrl);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Jeugdwerking" }));
  },
};

/**
 * Empty list — no upcoming events at all: "Nog geen evenementen gepland" on
 * the tier-"surface" `<EmptyState>`. The filter row hides — nothing to
 * filter, and showing it invited a dead-end loop (round 3 review, C5).
 */
export const Empty: Story = {
  args: { events: [] },
};
