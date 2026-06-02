import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TicketStub } from "./TicketStub";

const meta = {
  title: "Features/Calendar/TicketStub",
  component: TicketStub,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    title: "Spaghetti-avond",
    href: "/evenementen/spaghetti-avond",
    dateStart: "2026-09-12T18:00:00Z",
    eventType: "Clubevent",
    location: "Sportpark Driesput, Elewijt",
  },
} satisfies Meta<typeof TicketStub>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clubevent: Story = {};

export const Supportersactiviteit: Story = {
  args: { eventType: "Supportersactiviteit", title: "Supportersreis" },
};

export const Jeugdwerking: Story = {
  args: { eventType: "Jeugdwerking", title: "Jeugdkamp" },
};

export const Andere: Story = {
  args: { eventType: "Andere", title: "Algemene vergadering" },
};

/** No eventType set — renders the "Andere" render-time fallback (PRD §7). */
export const NoType: Story = {
  args: { eventType: null, title: "Evenement zonder type" },
};

export const NoLocation: Story = {
  args: { location: null },
};

export const Mobile: Story = {
  globals: { viewport: { value: "kcvvMobile" } },
};
