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

export const EmbedYoutube: Story = {
  name: "Embed — YouTube",
  args: {
    value: {
      _type: "videoBlock",
      embedUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      caption:
        "Embed via youtube-nocookie.com — provider chrome inside iframe.",
    },
  },
  parameters: {
    // vr.disable: external iframe (youtube-nocookie.com) loads network
    // resources that aren't deterministic for pixel diffing.
    // Repro: VR runner times out waiting for the iframe to finish loading.
    // Approved by: @climacon / #1849
    // Re-evaluate: 2026-08-01
    vr: { disable: true },
  },
};

export const EmbedVimeo: Story = {
  name: "Embed — Vimeo",
  args: {
    value: {
      _type: "videoBlock",
      embedUrl: "https://vimeo.com/824804225",
    },
  },
  parameters: {
    // vr.disable: external iframe (player.vimeo.com) loads network
    // resources that aren't deterministic for pixel diffing.
    // Repro: VR runner times out waiting for the iframe to finish loading.
    // Approved by: @climacon / #1849
    // Re-evaluate: 2026-08-01
    vr: { disable: true },
  },
};

export const EmbedUnknownProvider: Story = {
  name: "Embed — unknown provider (fallback)",
  args: {
    value: {
      _type: "videoBlock",
      embedUrl: "https://dailymotion.com/video/x1234abcd",
    },
  },
  parameters: {
    // vr.disable: the embed family of stories (YouTube + Vimeo + this
    // unknown-provider fallback) trip the runner's 30s timeout in CI
    // even though the fallback path renders a static neutral DOM with
    // no iframe — the preceding Vimeo / YouTube iframes still load
    // network resources during their own visits (vr.disable only
    // skips screenshot capture, not the visit), and the carry-over
    // delays this story's smoke-test past the cap.
    // Repro: VR runner times out 30s into the "smoke-test" for this
    // story after the YouTube + Vimeo embed stories run first.
    // Approved by: @climacon / #1849
    // Re-evaluate: 2026-08-01
    vr: { disable: true },
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

// ─── Aspect coverage (#1856) ─────────────────────────────────────────────
//
// Upload path was relaxed from forced 16:9 to `aspect="auto"` after live
// preview review showed letterbox bars on non-16:9 source videos. These
// stories lock the visual behaviour for two off-16:9 sources.

// Sintel trailer — 1280×546 (~2.35:1 cinematic) — Blender Foundation,
// hosted on the same google-cdn bucket as BigBuckBunny so no new network
// dependency is introduced. Same provenance, different aspect.
const SAMPLE_MP4_CINEMATIC =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4";
const SAMPLE_POSTER_CINEMATIC =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg";

// VR captures run pre-play (no autoplay), so the visible aspect is driven
// by the poster — the deliberately 1:1 local fixture exercises the auto
// container in the "frame becomes a square" direction. The underlying
// MP4 stays the 16:9 BigBuckBunny sample because no 1:1 sample exists in
// the gtv-videos-bucket pool and we won't add a new network dependency.
// Acceptable trade-off per the #1856 implementation notes.
const SAMPLE_POSTER_SQUARE = fixtureImage("news-thumb-square", 0);

export const UploadAspectCinematic: Story = {
  name: "Upload — aspect 2.35:1 (cinematic)",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_CINEMATIC,
        size: 5_242_880,
        mimeType: "video/mp4",
        originalFilename: "cinematic-sample.mp4",
      },
      videoPosterUrl: SAMPLE_POSTER_CINEMATIC,
      caption: "Cinematic 2.35:1 source — TapedFigure stretches to fit.",
      width: "prose",
    },
  },
};

export const UploadAspectSquare: Story = {
  name: "Upload — aspect 1:1 (square)",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_URL,
        size: 5_242_880,
        mimeType: "video/mp4",
        originalFilename: "square-sample.mp4",
      },
      videoPosterUrl: SAMPLE_POSTER_SQUARE,
      caption: "Square 1:1 source — frame becomes a square.",
      width: "prose",
    },
  },
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
