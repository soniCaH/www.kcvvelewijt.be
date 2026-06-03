import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { EventVM } from "@/lib/repositories/event.repository";
import { EventMonthList } from "./EventMonthList";

function ev(overrides: Partial<EventVM> & { id: string }): EventVM {
  return {
    title: "Evenement",
    slug: overrides.id,
    eventType: "Clubevent",
    dateStart: "2026-09-12T18:00:00Z",
    dateEnd: null,
    location: "Sportpark Driesput, Elewijt",
    href: "#",
    featuredOnHome: false,
    coverImageUrl: null,
    ...overrides,
  };
}

const meta = {
  title: "Features/Calendar/EventMonthList",
  component: EventMonthList,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof EventMonthList>;

export default meta;
type Story = StoryObj<typeof meta>;

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
        dateStart: "2026-09-20T08:00:00Z",
      }),
      ev({
        id: "jeugdkamp",
        title: "Jeugdkamp",
        eventType: "Jeugdwerking",
        dateStart: "2026-10-14T10:00:00Z",
        dateEnd: "2026-10-16T16:00:00Z",
      }),
    ],
  },
};

/** Year appears on every month heading once the list crosses into a new year. */
export const SpanningYears: Story = {
  args: {
    events: [
      ev({
        id: "kerstdrink",
        title: "Kerstdrink",
        dateStart: "2026-12-20T18:00:00Z",
      }),
      ev({
        id: "nieuwjaarsreceptie",
        title: "Nieuwjaarsreceptie",
        eventType: "Andere",
        dateStart: "2027-01-10T15:00:00Z",
      }),
    ],
  },
};
