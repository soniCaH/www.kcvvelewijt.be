import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EventFactStrip } from "./EventFactStrip";

const meta = {
  title: "Article/EventFactStrip",
  component: EventFactStrip,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft px-12 py-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventFactStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single-day event — venue + start time, no sessions, ticket CTA. */
export const SingleDay: Story = {
  args: {
    value: {
      date: "2026-11-14",
      startTime: "19:00",
      location: "Clubhuis KCVV",
      address: "Driesstraat 14 · 1982 Elewijt",
      capacity: 80,
      ticketUrl: "https://kcvv.example/inschrijven",
      ticketLabel: "Reserveer",
    },
  },
};

/** Recurring event with sessions[] — day-by-day schedule replaces the time line. */
export const Recurring: Story = {
  args: {
    value: {
      sessions: [
        {
          _key: "s1",
          date: "2026-11-14",
          startTime: "10:00",
          endTime: "17:00",
        },
        {
          _key: "s2",
          date: "2026-11-15",
          startTime: "10:00",
          endTime: "17:00",
        },
        {
          _key: "s3",
          date: "2026-11-16",
          startTime: "12:00",
          endTime: "16:00",
        },
      ],
      location: "Clubhuis KCVV",
      address: "Driesstraat 14 · 1982 Elewijt",
      capacity: 24,
      ticketUrl: "https://kcvv.example/inschrijven",
      ticketLabel: "Inschrijven",
    },
  },
};

/** Without ticketUrl — CTA cell hides; body cell stretches. */
export const NoTicketUrl: Story = {
  args: {
    value: {
      date: "2026-11-14",
      startTime: "19:00",
      location: "Clubhuis KCVV",
      address: "Driesstraat 14 · 1982 Elewijt",
      capacity: 80,
    },
  },
};

/** With agenda link — `★ Ook in agenda →` line at bottom of body cell. */
export const WithAgendaLink: Story = {
  args: {
    value: {
      date: "2026-11-14",
      startTime: "19:00",
      location: "Clubhuis KCVV",
      address: "Driesstraat 14 · 1982 Elewijt",
      capacity: 80,
      ticketUrl: "https://kcvv.example/inschrijven",
    },
    linkedEventSlug: "familiedag-2026",
  },
};

/**
 * Mobile — vertical stack (date → seam → body → CTA). Forced via
 * `orientation="vertical"`; wrapper constrains width to mimic phone.
 */
export const Mobile: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto w-[380px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    orientation: "vertical",
    value: {
      date: "2026-11-14",
      startTime: "19:00",
      location: "Clubhuis KCVV",
      address: "Driesstraat 14",
      capacity: 80,
      ticketUrl: "https://kcvv.example/inschrijven",
    },
  },
};
