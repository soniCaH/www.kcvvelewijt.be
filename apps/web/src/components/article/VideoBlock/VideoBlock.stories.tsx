import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VideoBlock } from "./VideoBlock";
import { fixtureImage } from "@test-fixtures/images";

/**
 * Phase 5 (#1849) re-frames the renderer around `<TapedFigure>` plus a
 * locked `▶ Afspelen` press-down pill on the upload path. Phase 1-4
 * behaviour is preserved: upload, embed, poster, caption, width, analytics.
 *
 * The fixture video is the public-domain "Big Buck Bunny" trailer hosted
 * on Google's gtv-videos-bucket — a stable open reference clip used across
 * the web video testing ecosystem. Poster fixtures use the local article
 * hero so the same image renders every time.
 */
const SAMPLE_MP4_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SAMPLE_POSTER_URL = fixtureImage("article-hero-generic", 0);

const meta = {
  title: "Features/Articles/VideoBlock",
  component: VideoBlock,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
  decorators: [
    (Story) => (
      <div className="bg-cream py-8">
        <Story />
      </div>
    ),
  ],
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
      videoPosterUrl: SAMPLE_POSTER_URL,
      caption: "Match highlights — KCVV vs Boechout.",
    },
  },
};

export const UploadWithPoster: Story = {
  name: "Upload — with poster + Afspelen pill",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_URL,
        size: 5_242_880,
        mimeType: "video/mp4",
        originalFilename: "highlights.mp4",
      },
      videoPosterUrl: SAMPLE_POSTER_URL,
      caption: "Samenvatting: KCVV Elewijt — KFC Boechout (3–1).",
    },
  },
};

export const UploadWithoutPoster: Story = {
  name: "Upload — no poster (ink fallback + pill)",
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
};

export const UploadNoCaption: Story = {
  name: "Upload — no caption (figcap omitted)",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_URL,
        size: 5_242_880,
        mimeType: "video/mp4",
        originalFilename: "highlights.mp4",
      },
      videoPosterUrl: SAMPLE_POSTER_URL,
    },
  },
};

// ─── Embed stories ────────────────────────────────────────────────────────

// `vr-skip` (discovery-time exclusion) replaces the previous
// `parameters.vr.disable` (postVisit screenshot-skip) for the embed
// stories. `vr.disable` only suppresses screenshot capture — the
// runner still visits the page, which means the YouTube + Vimeo
// iframes load network resources. The carry-over from those visits
// kept pushing alphabetically-later VideoBlock stories
// (Width — prose / wide / bleed / Mobile — narrow) past the 30s
// smoke-test cap intermittently. `vr-skip` stops discovery at the
// source: the runner never opens these pages, so no iframe loads,
// no carry-over. Re-evaluate 2026-08-01 alongside the other embed
// annotations.
export const EmbedYoutube: Story = {
  name: "Embed — YouTube",
  tags: ["vr-skip"],
  args: {
    value: {
      _type: "videoBlock",
      embedUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      caption:
        "Embed via youtube-nocookie.com — provider chrome inside iframe.",
    },
  },
};

export const EmbedVimeo: Story = {
  name: "Embed — Vimeo",
  tags: ["vr-skip"],
  args: {
    value: {
      _type: "videoBlock",
      embedUrl: "https://vimeo.com/824804225",
    },
  },
};

export const EmbedUnknownProvider: Story = {
  name: "Embed — unknown provider (fallback)",
  tags: ["vr-skip"],
  args: {
    value: {
      _type: "videoBlock",
      embedUrl: "https://dailymotion.com/video/x1234abcd",
    },
  },
};

// ─── Width variants ──────────────────────────────────────────────────────

export const WidthProse: Story = {
  name: "Width — prose (default)",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_URL,
        size: 5_242_880,
        mimeType: "video/mp4",
        originalFilename: "highlights.mp4",
      },
      videoPosterUrl: SAMPLE_POSTER_URL,
      caption: "Prose width — 680px reading column.",
      width: "prose",
    },
  },
};

export const WidthWide: Story = {
  name: "Width — wide (1040px)",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_URL,
        size: 5_242_880,
        mimeType: "video/mp4",
        originalFilename: "highlights.mp4",
      },
      videoPosterUrl: SAMPLE_POSTER_URL,
      caption: "Wide — 1040px container, tape preserved.",
      width: "wide",
    },
  },
};

export const WidthBleed: Story = {
  name: "Width — bleed (100vw, tape suppressed)",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_URL,
        size: 5_242_880,
        mimeType: "video/mp4",
        originalFilename: "highlights.mp4",
      },
      videoPosterUrl: SAMPLE_POSTER_URL,
      caption: "Bleed — 100vw, tape suppressed per the width-rules table.",
      width: "bleed",
    },
  },
  parameters: { layout: "fullscreen" },
};

export const MobileNarrow: Story = {
  name: "Mobile — narrow viewport (375px)",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_URL,
        size: 5_242_880,
        mimeType: "video/mp4",
        originalFilename: "highlights.mp4",
      },
      videoPosterUrl: SAMPLE_POSTER_URL,
      caption: "Mobile — 16:9 frame clamps to viewport.",
    },
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
