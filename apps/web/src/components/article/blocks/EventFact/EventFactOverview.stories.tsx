import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EventFactOverview } from "./EventFactOverview";

const meta = {
  title: "Features/Articles/EventFact/Overview",
  component: EventFactOverview,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Overview variant of the `eventFact` body block (design §8.2). Full-bleed dark band — consecutive rows fuse seamlessly via globals.css sibling rules. Three slots on md+: date cluster, title + metadata, CTA right. The CTA hides entirely when `ticketUrl` is missing.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EventFactOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTicketCta: Story = {
  args: {
    value: {
      title: "Lentetornooi U13",
      date: "2026-04-27",
      startTime: "10:00",
      endTime: "17:00",
      location: "Sportpark Elewijt",
      ageGroup: "U13",
      ticketUrl: "https://kcvvelewijt.be/inschrijven",
    },
  },
};

export const WithCustomLabel: Story = {
  args: {
    value: {
      title: "Clubfeest",
      date: "2026-06-14",
      startTime: "18:00",
      location: "Kantine KCVV",
      competitionTag: "Clubfeest",
      ticketUrl: "https://kcvvelewijt.be/clubfeest",
      ticketLabel: "Boek je plek",
    },
  },
};

export const WithoutCta: Story = {
  args: {
    value: {
      title: "Training hervat",
      date: "2026-08-01",
      startTime: "18:30",
      endTime: "20:00",
      location: "Sportpark Elewijt",
      ageGroup: "Senioren",
    },
  },
};

export const NoDateYet: Story = {
  args: {
    value: {
      title: "Datum volgt",
      location: "Sportpark Elewijt",
      ageGroup: "Alle jeugd",
    },
  },
};
