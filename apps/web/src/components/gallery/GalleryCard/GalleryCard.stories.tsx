import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GalleryCard } from "./GalleryCard";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Gallery/GalleryCard",
  component: GalleryCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Retro-terrace gallery card — cover in colour newsprint, a MonoLabel photo " +
          "count, the title and date. Shares the flush-edge `<TapedCard>` composition + " +
          "canonical press-down hover with `<NewsCard>`.",
      },
    },
  },
  argTypes: {
    imageCount: { control: "number" },
    date: { control: "text" },
    coverUrl: { control: "text" },
  },
} satisfies Meta<typeof GalleryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "3-1 tegen Zemst — de beelden",
    href: "/galerij/zemst-derby",
    coverUrl: fixtureImage("match-action", 0),
    coverAlt: "Spelmoment",
    imageCount: 24,
    date: "15 januari 2025",
  },
  tags: ["vr"],
};

export const SinglePhoto: Story = {
  args: {
    title: "Eén beeld zegt genoeg",
    href: "/galerij/een-beeld",
    coverUrl: fixtureImage("crowd-atmosphere", 0),
    imageCount: 1,
    date: "2 maart 2026",
  },
};

export const LongTitle: Story = {
  args: {
    title:
      "Mosselfeest 2026: een avond vol sfeer, vrijwilligers en volle borden in de kantine",
    href: "/galerij/mosselfeest-2026",
    coverUrl: fixtureImage("event-cover", 1),
    imageCount: 58,
    date: "5 mei 2025",
  },
  tags: ["vr"],
};

export const WithoutCover: Story = {
  args: {
    title: "Galerij zonder cover",
    href: "/galerij/geen-cover",
    imageCount: 12,
    date: "10 januari 2025",
  },
  tags: ["vr"],
};

export const Grid: Story = {
  args: { ...Default.args },
  decorators: [
    (Story) => (
      <div className="grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Story />
        <GalleryCard
          title="Jeugdtornooi — zondagochtend"
          href="/galerij/jeugdtornooi"
          coverUrl={fixtureImage("team-group", 0)}
          imageCount={42}
          date="14 maart 2026"
        />
        <GalleryCard
          title="Training onder de lichten"
          href="/galerij/training-lichten"
          coverUrl={fixtureImage("training", 0)}
          imageCount={9}
          date="12 januari 2025"
        />
      </div>
    ),
  ],
};
