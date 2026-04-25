import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { VideoBlock, type VideoBlockValue } from "./VideoBlock";

const mockTrackEvent = vi.mocked(trackEvent);

const withAsset = (
  overrides: Partial<NonNullable<VideoBlockValue["videoAsset"]>> = {},
): VideoBlockValue => ({
  _type: "videoBlock",
  videoAsset: {
    url: "https://cdn.sanity.io/files/vhb33jaz/staging/video-asset.mp4",
    size: 5_242_880,
    mimeType: "video/mp4",
    originalFilename: "highlights.mp4",
    ...overrides,
  },
});

describe("VideoBlock", () => {
  it("renders a <video> element with the resolved asset URL and MIME type", () => {
    render(<VideoBlock value={withAsset()} />);
    const video = screen.getByTestId("video-block-video") as HTMLVideoElement;
    expect(video).toBeTruthy();
    const source = video.querySelector("source");
    expect(source?.getAttribute("src")).toBe(
      "https://cdn.sanity.io/files/vhb33jaz/staging/video-asset.mp4",
    );
    expect(source?.getAttribute("type")).toBe("video/mp4");
  });

  it("falls back to video/mp4 when mimeType is missing", () => {
    render(<VideoBlock value={withAsset({ mimeType: null })} />);
    const source = screen
      .getByTestId("video-block-video")
      .querySelector("source");
    expect(source?.getAttribute("type")).toBe("video/mp4");
  });

  it("returns null when videoAsset is absent (e.g. block authored without upload)", () => {
    const { container } = render(
      <VideoBlock value={{ _type: "videoBlock", videoAsset: null }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when the asset URL is an empty string", () => {
    const { container } = render(<VideoBlock value={withAsset({ url: "" })} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when the asset URL is null", () => {
    const { container } = render(
      <VideoBlock value={withAsset({ url: null })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when the asset URL key is absent entirely", () => {
    // withAsset() defaults include a `url`. Strip it to simulate a
    // GROQ projection that returned a videoAsset object without the
    // `url` field — `typeof src !== "string"` must still catch it.
    const value: VideoBlockValue = {
      _type: "videoBlock",
      videoAsset: {
        size: 5_242_880,
        mimeType: "video/mp4",
        originalFilename: "highlights.mp4",
      },
    };
    const { container } = render(<VideoBlock value={value} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("VideoBlock — embed path (Phase 2)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a privacy-enhanced YouTube iframe when embedUrl is a YouTube URL", () => {
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        }}
      />,
    );
    const iframe = screen.getByTestId(
      "video-block-iframe",
    ) as HTMLIFrameElement;
    expect(iframe.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    const wrapper = screen.getByTestId("video-block");
    expect(wrapper.dataset.source).toBe("embed");
    expect(wrapper.dataset.provider).toBe("youtube");
  });

  it("renders the player.vimeo.com iframe when embedUrl is a Vimeo URL", () => {
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://vimeo.com/123456789",
        }}
      />,
    );
    const iframe = screen.getByTestId(
      "video-block-iframe",
    ) as HTMLIFrameElement;
    expect(iframe.getAttribute("src")).toBe(
      "https://player.vimeo.com/video/123456789",
    );
    expect(screen.getByTestId("video-block").dataset.provider).toBe("vimeo");
  });

  it("forwards loading=lazy + referrerPolicy on the iframe", () => {
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://youtu.be/dQw4w9WgXcQ",
        }}
      />,
    );
    const iframe = screen.getByTestId("video-block-iframe");
    expect(iframe.getAttribute("loading")).toBe("lazy");
    expect(iframe.getAttribute("referrerpolicy")).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("renders a neutral fallback (no iframe) for an unsupported host", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://dailymotion.com/video/x1234abcd",
        }}
      />,
    );
    expect(screen.queryByTestId("video-block-iframe")).toBeNull();
    const wrapper = screen.getByTestId("video-block");
    expect(wrapper.dataset.source).toBe("embed-unknown");
    expect(screen.getByText(/provider niet ondersteund/i)).toBeTruthy();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("does NOT interpolate the raw URL into the DOM for an unsupported host (XSS guard)", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const suspicious = "https://evil.example.com/watch?v=dQw4w9WgXcQ";
    const { container } = render(
      <VideoBlock value={{ _type: "videoBlock", embedUrl: suspicious }} />,
    );
    expect(container.innerHTML).not.toContain(suspicious);
    expect(container.innerHTML).not.toContain("evil.example.com");
  });

  it("prefers embedUrl over videoAsset when both are populated (defensive)", () => {
    // Normally the Sanity XOR validator makes this state unreachable,
    // but the runtime must still pick a single deterministic path.
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          videoAsset: {
            url: "https://cdn.sanity.io/files/vhb33jaz/staging/other.mp4",
            size: 1_000_000,
            mimeType: "video/mp4",
            originalFilename: "other.mp4",
          },
        }}
      />,
    );
    expect(screen.getByTestId("video-block").dataset.source).toBe("embed");
    expect(screen.queryByTestId("video-block-video")).toBeNull();
  });
});

describe("VideoBlock — Phase 3 polish (#1365)", () => {
  it("upload path: <video> uses preload='none' so no MP4 bytes load until the reader presses play", () => {
    render(<VideoBlock value={withAsset()} />);
    const video = screen.getByTestId("video-block-video");
    expect(video.getAttribute("preload")).toBe("none");
  });

  it("upload path: forwards videoPosterUrl to the <video poster> attribute", () => {
    render(
      <VideoBlock
        value={{
          ...withAsset(),
          videoPosterUrl:
            "https://cdn.sanity.io/images/vhb33jaz/staging/poster.webp",
        }}
      />,
    );
    const video = screen.getByTestId("video-block-video");
    expect(video.getAttribute("poster")).toBe(
      "https://cdn.sanity.io/images/vhb33jaz/staging/poster.webp",
    );
  });

  it("upload path: omits the poster attribute when videoPosterUrl is empty/null", () => {
    render(<VideoBlock value={{ ...withAsset(), videoPosterUrl: "" }} />);
    const video = screen.getByTestId("video-block-video");
    expect(video.getAttribute("poster")).toBeNull();
  });

  it("renders a <figcaption> when caption is non-empty (upload path)", () => {
    render(
      <VideoBlock
        value={{
          ...withAsset(),
          caption: "Match highlights — KCVV vs Boechout",
        }}
      />,
    );
    const caption = screen.getByTestId("video-block-caption");
    expect(caption.tagName).toBe("FIGCAPTION");
    expect(caption.textContent).toBe("Match highlights — KCVV vs Boechout");
  });

  it("renders a <figcaption> when caption is non-empty (embed path)", () => {
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
          caption: "First-ever YouTube upload",
        }}
      />,
    );
    const caption = screen.getByTestId("video-block-caption");
    expect(caption.textContent).toBe("First-ever YouTube upload");
  });

  it("does not render a <figcaption> when caption is missing or whitespace-only", () => {
    const { rerender } = render(<VideoBlock value={withAsset()} />);
    expect(screen.queryByTestId("video-block-caption")).toBeNull();

    rerender(<VideoBlock value={{ ...withAsset(), caption: "   " }} />);
    expect(screen.queryByTestId("video-block-caption")).toBeNull();
  });

  it("fullBleed=false (default): figure carries rounded-[4px] without full-bleed", () => {
    render(<VideoBlock value={withAsset()} />);
    const figure = screen.getByTestId("video-block");
    expect(figure.className).toContain("rounded-[4px]");
    expect(figure.className).not.toContain("full-bleed");
    expect(figure.className).not.toContain("rounded-none");
  });

  it("fullBleed=true: figure carries full-bleed + rounded-none, drops rounded-[4px]", () => {
    render(<VideoBlock value={{ ...withAsset(), fullBleed: true }} />);
    const figure = screen.getByTestId("video-block");
    expect(figure.className).toContain("full-bleed");
    expect(figure.className).toContain("rounded-none");
    expect(figure.className).not.toContain("rounded-[4px]");
  });

  it("fullBleed applies on the embed path too", () => {
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://vimeo.com/123456789",
          fullBleed: true,
        }}
      />,
    );
    const figure = screen.getByTestId("video-block");
    expect(figure.className).toContain("full-bleed");
    expect(figure.className).toContain("rounded-none");
  });
});

describe("VideoBlock — analytics (#1366 Phase 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upload path: fires `article_video_play` once on the first play event", () => {
    render(
      <VideoBlock
        value={withAsset()}
        articleSlug="kcvv-vs-boechout"
        videoPosition={1}
      />,
    );
    const video = screen.getByTestId("video-block-video");
    fireEvent.play(video);
    expect(mockTrackEvent).toHaveBeenCalledWith("article_video_play", {
      article_slug: "kcvv-vs-boechout",
      video_source: "upload",
      video_provider: "native",
      video_position: 1,
    });
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it("upload path: dedups multiple `play` events to a single `article_video_play`", () => {
    render(
      <VideoBlock
        value={withAsset()}
        articleSlug="highlights"
        videoPosition={2}
      />,
    );
    const video = screen.getByTestId("video-block-video");
    fireEvent.play(video);
    fireEvent.play(video);
    fireEvent.play(video);
    const playCalls = mockTrackEvent.mock.calls.filter(
      ([name]) => name === "article_video_play",
    );
    expect(playCalls).toHaveLength(1);
  });

  it("upload path: fires `article_video_complete` on the `ended` event", () => {
    render(
      <VideoBlock
        value={withAsset()}
        articleSlug="highlights"
        videoPosition={1}
      />,
    );
    const video = screen.getByTestId("video-block-video");
    fireEvent.ended(video);
    expect(mockTrackEvent).toHaveBeenCalledWith("article_video_complete", {
      article_slug: "highlights",
      video_source: "upload",
      video_provider: "native",
      video_position: 1,
    });
  });

  it("upload path: each `ended` event fires `article_video_complete` (no dedup)", () => {
    // Pins the asymmetric design: `trackVideoPlay` dedups (one play per page
    // view), `trackVideoComplete` does not (each natural completion / replay
    // is a real, separate event).
    render(
      <VideoBlock
        value={withAsset()}
        articleSlug="highlights"
        videoPosition={1}
      />,
    );
    const video = screen.getByTestId("video-block-video");
    fireEvent.ended(video);
    fireEvent.ended(video);
    fireEvent.ended(video);
    const completeCalls = mockTrackEvent.mock.calls.filter(
      ([name]) => name === "article_video_complete",
    );
    expect(completeCalls).toHaveLength(3);
    for (const call of completeCalls) {
      expect(call[1]).toEqual({
        article_slug: "highlights",
        video_source: "upload",
        video_provider: "native",
        video_position: 1,
      });
    }
  });

  it("does NOT fire any analytics when articleSlug is missing (non-article context, e.g. staff bio)", () => {
    render(<VideoBlock value={withAsset()} videoPosition={1} />);
    const video = screen.getByTestId("video-block-video");
    fireEvent.play(video);
    fireEvent.ended(video);
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it("does NOT fire any analytics when videoPosition is missing", () => {
    render(<VideoBlock value={withAsset()} articleSlug="some-article" />);
    const video = screen.getByTestId("video-block-video");
    fireEvent.play(video);
    fireEvent.ended(video);
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it("embed path (YouTube): fires `article_video_play` once when the iframe receives focus", async () => {
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        }}
        articleSlug="trainer-interview"
        videoPosition={3}
      />,
    );
    const iframe = screen.getByTestId("video-block-iframe");
    // Simulate the user clicking the iframe: parent window blurs and the
    // iframe becomes the active element. This is the documented heuristic
    // for detecting embed engagement without provider postMessage wiring.
    iframe.focus();
    await act(async () => {
      window.dispatchEvent(new Event("blur"));
    });
    expect(mockTrackEvent).toHaveBeenCalledWith("article_video_play", {
      article_slug: "trainer-interview",
      video_source: "embed",
      video_provider: "youtube",
      video_position: 3,
    });
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it("embed path: dedups multiple iframe-focus + blur cycles to one `article_video_play`", async () => {
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        }}
        articleSlug="trainer-interview"
        videoPosition={3}
      />,
    );
    const iframe = screen.getByTestId("video-block-iframe");
    iframe.focus();
    await act(async () => {
      window.dispatchEvent(new Event("blur"));
    });
    iframe.focus();
    await act(async () => {
      window.dispatchEvent(new Event("blur"));
    });
    iframe.focus();
    await act(async () => {
      window.dispatchEvent(new Event("blur"));
    });
    const playCalls = mockTrackEvent.mock.calls.filter(
      ([name]) => name === "article_video_play",
    );
    expect(playCalls).toHaveLength(1);
  });

  it("embed path: window blur with a different active element does NOT fire", async () => {
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://vimeo.com/123456789",
        }}
        articleSlug="highlights"
        videoPosition={1}
      />,
    );
    // No iframe focus — simulate generic window blur (e.g. user tabbing
    // away from the browser). The heuristic must only fire when the iframe
    // is the active element.
    await act(async () => {
      window.dispatchEvent(new Event("blur"));
    });
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
