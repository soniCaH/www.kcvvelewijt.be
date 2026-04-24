import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VideoBlock } from "./VideoBlock";

/**
 * Tracer-bullet render for `videoBlock` (#1363). Phase 1 exposes the
 * minimal upload path — a bare `<video controls>` pointing at a Sanity
 * file asset URL. Phase 2 will add the embed stories
 * (`EmbedYoutube`/`EmbedVimeo`) and Phase 3 will add
 * `WithPosterAndCaption` / `FullBleed`.
 *
 * The fixture video is the public-domain "Big Buck Bunny" trailer hosted
 * on Google's gtv-videos-bucket — a long-standing open reference clip
 * used across the web video testing ecosystem, picked here so the story
 * doesn't depend on any private or ephemeral asset.
 */
const SAMPLE_MP4_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const meta = {
  title: "Features/Articles/VideoBlock",
  component: VideoBlock,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    value: { control: { type: "object" } },
  },
} satisfies Meta<typeof VideoBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_URL,
        size: 1_048_576,
        mimeType: "video/mp4",
        originalFilename: "sample.mp4",
      },
    },
  },
};

export const UploadOnly: Story = {
  name: "Upload only (tracer)",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_URL,
        size: 5_242_880,
        mimeType: "video/mp4",
        originalFilename: "highlights.mp4",
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Tracer-bullet render: a single uploaded MP4 rendered via the native HTML5 <video> element. No embed, no poster, no caption — Phase 1 only.",
      },
    },
  },
};

export const MissingAsset: Story = {
  name: "Missing asset (returns null)",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: null,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Defensive fallback: when the block is authored but no file was uploaded, the component returns null rather than rendering a broken <video> element.",
      },
    },
  },
};
