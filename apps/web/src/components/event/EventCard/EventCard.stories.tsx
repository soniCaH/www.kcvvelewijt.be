import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EventCard } from "./EventCard";

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
    imageUrl: "https://placehold.co/600x400/4acf52/ffffff?text=Event",
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
    imageUrl: "https://placehold.co/600x400/4acf52/ffffff?text=Event",
    endDate: new Date("2026-06-15T18:00:00"),
    excerpt: "Gezellig samen genieten met het hele gezin.",
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
};
