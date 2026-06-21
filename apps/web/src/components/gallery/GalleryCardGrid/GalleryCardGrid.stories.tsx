import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { GalleryCardVM } from "@/lib/repositories/photoGallery.repository";
import { fixtureImage } from "@test-fixtures/images";
import { GalleryCardGrid } from "./GalleryCardGrid";

const GALLERIES: GalleryCardVM[] = [
  {
    id: "1",
    title: "3-1 tegen Zemst — de beelden",
    slug: "zemst-derby",
    publishedAt: "2026-01-15T12:00:00Z",
    imageCount: 24,
    coverUrl: fixtureImage("match-action", 0),
    coverLqip: null,
    coverAlt: "Spelmoment",
  },
  {
    id: "2",
    title: "Jeugdtornooi — zondagochtend",
    slug: "jeugdtornooi",
    publishedAt: "2026-03-14T09:00:00Z",
    imageCount: 42,
    coverUrl: fixtureImage("team-group", 0),
    coverLqip: null,
    coverAlt: "Ploegfoto",
  },
  {
    id: "3",
    title: "Mosselfeest 2026 in de kantine",
    slug: "mosselfeest-2026",
    publishedAt: "2026-05-05T18:00:00Z",
    imageCount: 58,
    coverUrl: fixtureImage("event-cover", 1),
    coverLqip: null,
    coverAlt: "Sfeerbeeld",
  },
  {
    id: "4",
    title: "Training onder de lichten",
    slug: "training-lichten",
    publishedAt: "2025-01-12T20:00:00Z",
    imageCount: 9,
    coverUrl: fixtureImage("training", 0),
    coverLqip: null,
    coverAlt: "Training",
  },
  {
    id: "5",
    title: "Supportersbus naar de bekerfinale",
    slug: "supportersbus",
    publishedAt: "2025-04-20T08:00:00Z",
    imageCount: 31,
    coverUrl: fixtureImage("crowd-atmosphere", 0),
    coverLqip: null,
    coverAlt: "Supporters",
  },
];

const meta = {
  title: "Features/Gallery/GalleryCardGrid",
  component: GalleryCardGrid,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Responsive 3-up grid of `<GalleryCard>` with slot-cycled tape rotations. " +
          "Used by the `/galerij` list and the match/event detail gallery sections.",
      },
    },
  },
} satisfies Meta<typeof GalleryCardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { galleries: GALLERIES },
  tags: ["vr"],
};

export const SingleGallery: Story = {
  args: { galleries: GALLERIES.slice(0, 1) },
};

export const TwoGalleries: Story = {
  args: { galleries: GALLERIES.slice(0, 2) },
  tags: ["vr"],
};
