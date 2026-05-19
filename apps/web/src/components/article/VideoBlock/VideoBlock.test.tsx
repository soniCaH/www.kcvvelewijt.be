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

// Click the locked `▶ Afspelen` pill so the native `<video>` element
// mounts. The Phase 5 redesign holds the player behind a click affordance
// so the browser never loads bytes on first paint.
function clickPlayPill() {
  fireEvent.click(screen.getByTestId("video-block-play-pill"));
}

describe("VideoBlock — upload path (Phase 5 #1849)", () => {
  it("renders the Afspelen pill on first paint instead of a <video>", () => {
    render(<VideoBlock value={withAsset()} />);
    expect(screen.getByTestId("video-block-play-pill")).toBeTruthy();
    expect(screen.queryByTestId("video-block-video")).toBeNull();
  });

  it("mounts the <video> with the resolved asset URL + MIME type after pill click", () => {
    render(<VideoBlock value={withAsset()} />);
    clickPlayPill();
    const video = screen.getByTestId("video-block-video") as HTMLVideoElement;
    const source = video.querySelector("source");
    expect(source?.getAttribute("src")).toBe(
      "https://cdn.sanity.io/files/vhb33jaz/staging/video-asset.mp4",
    );
    expect(source?.getAttribute("type")).toBe("video/mp4");
  });

  it("falls back to video/mp4 when mimeType is missing", () => {
    render(<VideoBlock value={withAsset({ mimeType: null })} />);
    clickPlayPill();
    const source = screen
      .getByTestId("video-block-video")
      .querySelector("source");
    expect(source?.getAttribute("type")).toBe("video/mp4");
  });

  it("returns null when videoAsset is absent", () => {
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

  it("renders the poster image before the pill is pressed", () => {
    render(
      <VideoBlock
        value={{
          ...withAsset(),
          videoPosterUrl:
            "https://cdn.sanity.io/images/vhb33jaz/staging/poster.webp",
        }}
      />,
    );
    expect(screen.getByTestId("video-block-poster")).toBeTruthy();
  });

  it("hides the poster + pill once playback starts", () => {
    render(
      <VideoBlock
        value={{
          ...withAsset(),
          videoPosterUrl:
            "https://cdn.sanity.io/images/vhb33jaz/staging/poster.webp",
        }}
      />,
    );
    clickPlayPill();
    expect(screen.queryByTestId("video-block-poster")).toBeNull();
    expect(screen.queryByTestId("video-block-play-pill")).toBeNull();
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

  it("does NOT interpolate the raw URL into the DOM for an unsupported host", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const suspicious = "https://evil.example.com/watch?v=dQw4w9WgXcQ";
    const { container } = render(
      <VideoBlock value={{ _type: "videoBlock", embedUrl: suspicious }} />,
    );
    expect(container.innerHTML).not.toContain(suspicious);
    expect(container.innerHTML).not.toContain("evil.example.com");
  });

  it("prefers embedUrl over videoAsset when both are populated", () => {
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

describe("VideoBlock — caption + width (Phase 5)", () => {
  it("renders a <figcaption> when caption is non-empty (upload path)", () => {
    const { container } = render(
      <VideoBlock
        value={{
          ...withAsset(),
          caption: "Match highlights — KCVV vs Boechout",
        }}
      />,
    );
    const cap = container.querySelector("figcaption");
    expect(cap?.textContent).toContain("Match highlights — KCVV vs Boechout");
  });

  it("renders a <figcaption> when caption is non-empty (embed path)", () => {
    const { container } = render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
          caption: "First-ever YouTube upload",
        }}
      />,
    );
    expect(container.querySelector("figcaption")?.textContent).toContain(
      "First-ever YouTube upload",
    );
  });

  it("does not render a <figcaption> when caption is missing or whitespace", () => {
    const { container, rerender } = render(<VideoBlock value={withAsset()} />);
    expect(container.querySelector("figcaption")).toBeNull();

    rerender(<VideoBlock value={{ ...withAsset(), caption: "   " }} />);
    expect(container.querySelector("figcaption")).toBeNull();
  });

  it("width=prose (default): width wrapper carries data-video-width=prose", () => {
    render(<VideoBlock value={withAsset()} />);
    const marker = screen.getByTestId("video-block");
    expect(marker.dataset.videoWidth).toBe("prose");
  });

  it("width=wide: width wrapper carries data-video-width=wide", () => {
    render(<VideoBlock value={{ ...withAsset(), width: "wide" }} />);
    expect(screen.getByTestId("video-block").dataset.videoWidth).toBe("wide");
  });

  it("width=bleed: width wrapper carries data-video-width=bleed", () => {
    render(<VideoBlock value={{ ...withAsset(), width: "bleed" }} />);
    expect(screen.getByTestId("video-block").dataset.videoWidth).toBe("bleed");
  });

  it("legacy fullBleed=true maps to width=bleed (one-release fallback)", () => {
    render(<VideoBlock value={{ ...withAsset(), fullBleed: true }} />);
    expect(screen.getByTestId("video-block").dataset.videoWidth).toBe("bleed");
  });

  it("bleed applies on the embed path too", () => {
    render(
      <VideoBlock
        value={{
          _type: "videoBlock",
          embedUrl: "https://vimeo.com/123456789",
          width: "bleed",
        }}
      />,
    );
    expect(screen.getByTestId("video-block").dataset.videoWidth).toBe("bleed");
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
    clickPlayPill();
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
    clickPlayPill();
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
    clickPlayPill();
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
    render(
      <VideoBlock
        value={withAsset()}
        articleSlug="highlights"
        videoPosition={1}
      />,
    );
    clickPlayPill();
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

  it("does NOT fire any analytics when articleSlug is missing", () => {
    render(<VideoBlock value={withAsset()} videoPosition={1} />);
    clickPlayPill();
    const video = screen.getByTestId("video-block-video");
    fireEvent.play(video);
    fireEvent.ended(video);
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it("does NOT fire any analytics when videoPosition is missing", () => {
    render(<VideoBlock value={withAsset()} articleSlug="some-article" />);
    clickPlayPill();
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
    await act(async () => {
      window.dispatchEvent(new Event("blur"));
    });
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
