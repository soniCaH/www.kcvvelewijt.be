import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EventFactInline } from "./EventFactInline";
import type { EventFactValue } from "../EventFact/types";

const BASE: EventFactValue = {
  _type: "eventFact",
  title: "Steakfestijn 2026",
  date: "2026-06-13",
  startTime: "18:00",
  endTime: "22:00",
  location: "Sportpark Elewijt",
  capacity: 180,
  competitionTag: "Clubfeest",
  ticketUrl: "https://example.com/inschrijven",
  ticketLabel: "Inschrijven",
};

const meta = {
  title: "Features/Articles/Blocks/EventFactInline",
  component: EventFactInline,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Phase 5 inline polaroid renderer for body-block eventFact references (eventfact-inline-locked.md). TapedCard cream-white frame + two ochre tape strips + Freight Display title/date + mono caps meta row + jersey-deep INSCHRIJVEN CTA. Past events swap the tag pill for `Afgelopen` and hide the CTA.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story) => (
      <div className="bg-cream max-w-[760px] py-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventFactInline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpcomingWithCta: Story = {
  args: { value: BASE, isPast: false },
};

export const UpcomingMinimalFields: Story = {
  name: "Upcoming — minimal (no location / no capacity)",
  args: {
    value: {
      _type: "eventFact",
      title: "Open trainingsdag",
      date: "2026-08-15",
      competitionTag: "Open dag",
      ticketUrl: "https://example.com/aanmelden",
    },
    isPast: false,
  },
};

export const UpcomingWithoutTicket: Story = {
  name: "Upcoming — no ticketUrl (CTA hidden)",
  args: {
    value: {
      ...BASE,
      ticketUrl: undefined,
    },
    isPast: false,
  },
};

export const PastEvent: Story = {
  name: "Past — Afgelopen pill, CTA suppressed",
  args: { value: BASE, isPast: true },
};

export const WithLinkedEvent: Story = {
  name: "With ★ Ook in agenda link",
  args: {
    value: BASE,
    isPast: false,
    linkedEventSlug: "steakfestijn-2026",
  },
};

export const RangeMultiDay: Story = {
  name: "Multi-day range (sameMonth)",
  args: {
    value: {
      _type: "eventFact",
      title: "Pinkstertornooi",
      date: "2026-05-23",
      endDate: "2026-05-25",
      location: "Sportpark Elewijt",
      capacity: 240,
      competitionTag: "Tornooi",
      ticketUrl: "https://example.com/aanmelden",
    },
    isPast: false,
  },
};

export const TwoConsecutive: Story = {
  name: "Two consecutive (rotation pattern)",
  args: { value: BASE, isPast: false },
  render: () => (
    <div className="flex flex-col gap-8">
      <EventFactInline value={BASE} isPast={false} />
      <EventFactInline
        value={{
          ...BASE,
          title: "Sponsor-avond 2026",
          date: "2026-09-12",
          startTime: "19:30",
          endTime: "23:00",
          competitionTag: "Sponsoring",
          ticketUrl: undefined,
        }}
        isPast={false}
      />
    </div>
  ),
};

export const ThreeConsecutive: Story = {
  name: "Three consecutive (3-cycle rotation)",
  args: { value: BASE, isPast: false },
  render: () => (
    <div className="flex flex-col gap-8">
      <EventFactInline value={BASE} isPast={false} />
      <EventFactInline
        value={{
          ...BASE,
          title: "Sponsor-avond 2026",
          date: "2026-09-12",
          startTime: "19:30",
          endTime: "23:00",
          competitionTag: "Sponsoring",
        }}
        isPast={false}
      />
      <EventFactInline
        value={{
          ...BASE,
          title: "Kerstdrink",
          date: "2026-12-22",
          startTime: "20:00",
          endTime: "23:30",
          competitionTag: "Clubfeest",
          capacity: 120,
        }}
        isPast={false}
      />
    </div>
  ),
};

export const MobileNarrow: Story = {
  name: "Mobile — narrow viewport (375px)",
  args: { value: BASE, isPast: false },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
