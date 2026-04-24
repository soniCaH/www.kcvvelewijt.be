import { describe, expect, it } from "vitest";
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

  it("returns null when the asset URL is missing (undefined)", () => {
    const { container } = render(
      <VideoBlock value={withAsset({ url: null })} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
