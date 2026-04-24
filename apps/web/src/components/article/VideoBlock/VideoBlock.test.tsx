import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VideoBlock, type VideoBlockValue } from "./VideoBlock";

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
