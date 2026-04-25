import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VideoBlock } from "./VideoBlock";

/**
 * Phase 1 (#1363) shipped the upload path; Phase 2 (#1364) added the
 * YouTube/Vimeo embed allowlist; Phase 3 (#1365) layers on poster
 * image, caption, lazy-load, fullBleed and a 150 MB soft-warning size
 * guard. The stories below cover all three phases so reviewers can
 * eyeball the matrix without bouncing between branches.
 *
 * The fixture video is the public-domain "Big Buck Bunny" trailer hosted
 * on Google's gtv-videos-bucket — a long-standing open reference clip
 * used across the web video testing ecosystem, picked here so the story
 * doesn't depend on any private or ephemeral asset. Poster fixtures use
 * picsum.photos with stable seeds so the same image renders every time.
 */
const SAMPLE_MP4_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SAMPLE_POSTER_URL =
  "https://picsum.photos/seed/kcvv-video-poster/1280/720";

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
      // "Me at the zoo" (jNQXAC9IVRw) — the first video ever uploaded to
      // YouTube (2005, by co-founder Jawed Karim). A stable, club-
      // unrelated public fixture used here to demonstrate that the
      // parser maps watch URLs to the youtube-nocookie.com/embed/<id>
      // iframe.
      embedUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
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
      embedUrl: "https://youtu.be/jNQXAC9IVRw?t=30",
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

// ─── Phase 3 — poster, caption, fullBleed (#1365) ─────────────────────────

export const WithPosterAndCaption: Story = {
  name: "Upload — poster + caption",
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
      caption:
        "Samenvatting: KCVV Elewijt — KFC Boechout (3–1). Beelden: club.",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Phase 3 (#1365) — `preload="none"` plus a hotspot-aware poster image means the browser fetches one JPEG and waits. The MP4 is only requested after the reader presses play. The caption is rendered as a `<figcaption>` directly under the video frame.',
      },
    },
  },
};

export const FullBleed: Story = {
  name: "Upload — fullBleed",
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
      caption:
        "Volledige breedte — geen afgeronde hoeken, breekt uit de leestkolom.",
      fullBleed: true,
    },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "`fullBleed: true` drops the rounded `4px` corners and applies the `.full-bleed` class so the figure breaks out of the centred 65ch prose column to the full viewport width. Mirrors `articleImage`'s full-bleed behaviour. Captions still render below the media frame.",
      },
    },
  },
};
