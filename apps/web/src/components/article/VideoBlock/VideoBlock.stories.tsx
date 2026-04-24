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
  name: "Upload only — mimeType fallback",
  args: {
    value: {
      _type: "videoBlock",
      videoAsset: {
        url: SAMPLE_MP4_URL,
        size: 5_242_880,
        // Deliberately null — exercises the `<source type>` fallback in
        // VideoBlock.tsx (defaults to video/mp4). Mirrors real Sanity
        // uploads where the asset sometimes lands without a server-
        // reported MIME type.
        mimeType: null,
        originalFilename: "highlights.mp4",
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Tracer-bullet render with `mimeType: null` on the asset — exercises the video/mp4 fallback branch in the serializer. Distinct from Playground, which ships a fully-populated asset.",
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

// ─── Phase 2 — embed URL stories (#1364) ──────────────────────────────────

export const EmbedYoutube: Story = {
  name: "Embed — YouTube",
  args: {
    value: {
      _type: "videoBlock",
      // Google's "Chrome Dino" short — a stable, club-unrelated public
      // video good enough to demonstrate the iframe path. Editors will
      // paste their own URL; this fixture just proves the parser maps
      // watch URLs to the youtube-nocookie.com/embed/<id> iframe.
      embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Renders the privacy-enhanced YouTube iframe (`youtube-nocookie.com/embed/<id>`) inside a 16:9 container. The serializer pulls the video ID from the `v=` query param via `parseEmbedUrl`.",
      },
    },
  },
};

export const EmbedYoutubeShort: Story = {
  name: "Embed — YouTube (youtu.be)",
  args: {
    value: {
      _type: "videoBlock",
      embedUrl: "https://youtu.be/dQw4w9WgXcQ?t=30",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Short-form `youtu.be/<id>` URLs resolve to the same iframe as their watch-URL equivalents. Trailing query params (`t=...`, `feature=...`) are ignored.",
      },
    },
  },
};

export const EmbedVimeo: Story = {
  name: "Embed — Vimeo",
  args: {
    value: {
      _type: "videoBlock",
      // Vimeo staff-picks short — public, ad-free, with a stable ID.
      embedUrl: "https://vimeo.com/824804225",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Renders the `player.vimeo.com/video/<id>` iframe inside a 16:9 container. Vimeo URLs are recognised via the numeric first path segment.",
      },
    },
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
    docs: {
      description: {
        story:
          "`parseEmbedUrl` rejects anything outside the YouTube/Vimeo allowlist. The serializer logs a `console.warn` (visible in the browser console) and renders a neutral Dutch-language fallback. The raw URL is **never** injected into the DOM, guarding against XSS and open-redirect risks.",
      },
    },
  },
};
