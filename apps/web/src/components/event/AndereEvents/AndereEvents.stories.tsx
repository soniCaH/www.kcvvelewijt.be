import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { EventVM } from "@/lib/repositories/event.repository";
import { AndereEvents } from "./AndereEvents";

function ev(overrides: Partial<EventVM> & { id: string }): EventVM {
  return {
    title: "Evenement",
    slug: overrides.id,
    eventType: "Clubevent",
    dateStart: "2026-09-12T18:00:00Z",
    dateEnd: null,
    location: "Kantine KCVV, Elewijt",
    href: "#",
    featuredOnHome: false,
    coverImageUrl: null,
    ...overrides,
  };
}

const meta = {
  title: "Features/Events/AndereEvents",
  component: AndereEvents,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs", "vr"],
  // Renders on the cream editorial detail page, at the detail-page measure.
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto max-w-3xl px-4 py-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AndereEvents>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Single-column, full-width `<TicketStub>` list (the 2-up grid squashed the
 * tear-off date block + wrapped titles), one per `eventType` colour + a
 * multi-day stub.
 */
export const Default: Story = {
  args: {
    events: [
      ev({
        id: "spaghetti-avond",
        title: "Spaghetti-avond",
        dateStart: "2026-09-12T18:00:00Z",
      }),
      ev({
        id: "supportersreis",
        title: "Supportersreis",
        eventType: "Supportersactiviteit",
        dateStart: "2026-09-25T08:00:00Z",
      }),
      ev({
        id: "jeugdkamp",
        title: "Jeugdkamp",
        eventType: "Jeugdwerking",
        dateStart: "2026-10-14T10:00:00Z",
        dateEnd: "2026-10-16T16:00:00Z",
      }),
      ev({
        id: "nieuwjaarsreceptie",
        title: "Nieuwjaarsreceptie",
        eventType: "Andere",
        dateStart: "2027-01-09T18:00:00Z",
      }),
    ],
  },
};

/** A single related event still renders full-width (no awkward half-row). */
export const SingleEvent: Story = {
  args: {
    events: [
      ev({
        id: "mosselfestijn",
        title: "Mosselfestijn",
        dateStart: "2026-11-14T18:00:00Z",
      }),
    ],
  },
};
