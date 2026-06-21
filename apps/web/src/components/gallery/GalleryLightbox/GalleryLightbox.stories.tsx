import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fixtureImage } from "@test-fixtures/images";
import { GalleryLightbox, type GalleryLightboxImage } from "./GalleryLightbox";

const IMAGES: GalleryLightboxImage[] = [
  {
    url: fixtureImage("match-action", 0),
    caption: "Openingsdoelpunt in de eerste helft",
    credit: "Foto: Jan Janssens",
  },
  {
    url: fixtureImage("crowd-atmosphere", 0),
    caption: "De thuissupporters vieren mee",
    credit: "Foto: Jan Janssens",
  },
  {
    url: fixtureImage("match-action", 1),
    caption: "Strijd om de tweede bal",
    credit: "Foto: An Peeters",
  },
  {
    url: fixtureImage("team-group", 0),
    caption: null,
    credit: "Foto: Jan Janssens",
  },
  { url: fixtureImage("training", 0), caption: "Warming-up", credit: null },
  { url: fixtureImage("event-cover", 0), caption: "Na de match", credit: null },
];

const meta = {
  title: "Features/Gallery/GalleryLightbox",
  component: GalleryLightbox,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Thumbnail grid + `yet-another-react-lightbox` viewer (Thumbnails + Zoom + " +
          "Captions). Thumbnails render in colour newsprint with LQIP blur; the first " +
          "row is `priority`. Click a thumbnail to open the lightbox — captions show as " +
          "an overlay with the credit beneath. Chrome is themed sharp-cornered.",
      },
    },
  },
} satisfies Meta<typeof GalleryLightbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { gallerySlug: "zemst-derby", images: IMAGES },
};

export const SingleImage: Story = {
  args: { gallerySlug: "een-beeld", images: IMAGES.slice(0, 1) },
};
