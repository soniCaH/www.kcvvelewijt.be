import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EventsList, type EventsListItem } from "./EventsList";
import EventsLoading from "@/app/(main)/events/loading";

const mockEvents: EventsListItem[] = [
  {
    title: "Club BBQ 2026",
    href: "/events/club-bbq-2026",
    date: new Date("2026-06-15T14:00:00"),
    endDate: new Date("2026-06-15T18:00:00"),
    location: "Sporthal Elewijt",
    imageUrl: "https://placehold.co/600x400/4acf52/ffffff?text=BBQ",
    excerpt: "Gezellig samen genieten met het hele gezin.",
  },
  {
    title: "Sponsorfeest",
    href: "/events/sponsorfeest",
    date: new Date("2026-07-01T19:00:00"),
    location: "Feestzaal De Kroon",
    imageUrl: "https://placehold.co/600x400/1a3a5c/ffffff?text=Feest",
  },
  {
    title: "Jeugdkamp 2026",
    href: "/events/jeugdkamp-2026",
    date: new Date("2026-08-10T09:00:00"),
    endDate: new Date("2026-08-14T17:00:00"),
    location: "Blaasveld",
    excerpt: "Vijf dagen vol voetbal, plezier en avontuur voor de jeugd.",
  },
];

const meta = {
  title: "Features/Calendar/EventsList",
  component: EventsList,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof EventsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { events: mockEvents },
};

export const Empty: Story = {
  args: { events: [] },
};

export const Loading: Story = {
  args: { events: [], isLoading: true },
};

export const SingleEvent: Story = {
  args: { events: mockEvents.slice(0, 1) },
};

export const Mobile: Story = {
  args: { events: mockEvents },
  globals: { viewport: { value: "kcvvMobile" } },
};

export const RouteSkeleton: StoryObj = {
  render: () => <EventsLoading />,
  parameters: { layout: "fullscreen" },
};
