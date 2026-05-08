import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EventCard } from "./EventCard";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Calendar/EventCard",
  component: EventCard,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    title: "Club BBQ 2026",
    href: "/events/club-bbq-2026",
    date: new Date("2026-06-15T14:00:00"),
    location: "Sporthal Elewijt",
  },
} satisfies Meta<typeof EventCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithImage: Story = {
  args: {
    imageUrl: fixtureImage("event-cover", 0),
  },
};

export const WithExcerpt: Story = {
  args: {
    excerpt:
      "Gezellig samen genieten met het hele gezin. Inschrijven via de club.",
  },
};

export const WithEndDate: Story = {
  args: {
    endDate: new Date("2026-06-15T18:00:00"),
  },
};

export const NoDate: Story = {
  args: { date: undefined, location: undefined },
};

export const FullCard: Story = {
  args: {
    imageUrl: fixtureImage("event-cover", 0),
    endDate: new Date("2026-06-15T18:00:00"),
    excerpt: "Gezellig samen genieten met het hele gezin.",
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
};
