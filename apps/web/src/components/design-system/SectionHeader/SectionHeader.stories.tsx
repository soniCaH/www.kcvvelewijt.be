// apps/web/src/components/design-system/SectionHeader/SectionHeader.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionHeader } from "./SectionHeader";

const meta = {
  title: "UI/SectionHeader",
  component: SectionHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Reusable section header with green left-border title and optional CTA link. " +
          "Use across all homepage sections. Encapsulates all heading-override styles — " +
          "consumers never fight the global h1-h6 cascade rule.",
      },
    },
  },
  argTypes: {
    variant: { control: "radio", options: ["light", "dark"] },
    as: { control: "radio", options: ["h1", "h2", "h3"] },
  },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Nieuws",
    linkText: "Alle berichten",
    linkHref: "/news",
    variant: "light",
  },
};

export const WithoutLink: Story = {
  args: {
    title: "Laatste nieuws",
    variant: "light",
  },
};

export const DarkVariant: Story = {
  parameters: { backgrounds: { default: "dark" } },
  args: {
    title: "Wedstrijden",
    linkText: "Volledige kalender",
    linkHref: "/calendar",
    variant: "dark",
  },
};

export const LongTitle: Story = {
  args: {
    title: "Onze hoofdsponsors",
    linkText: "Alle partners",
    linkHref: "/sponsors",
    variant: "light",
  },
};
