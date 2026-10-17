import { describe, expect, it } from "vitest";
import { shareCover } from "./share-content";

const URL = "https://cdn.sanity.io/images/p/d/cover-2000x1000.jpg";

describe("shareCover", () => {
  it("keeps an uncropped cover whole, hotspot as is (centre without one)", () => {
    expect(
      shareCover({
        coverUrl: URL,
        hotspot: null,
        crop: null,
        dimensions: null,
      }),
    ).toEqual({ url: URL, hotspot: { x: 0.5, y: 0.5 } });
  });

  it("applies the editor's crop as rect= and moves the hotspot into the crop", () => {
    expect(
      shareCover({
        coverUrl: URL,
        hotspot: { x: 0.5, y: 0.5 },
        crop: { left: 0.25, right: 0.25, top: 0, bottom: 0.5 },
        dimensions: { width: 2000, height: 1000 },
      }),
    ).toEqual({
      url: `${URL}?rect=500,0,1000,500`,
      hotspot: { x: 0.5, y: 1 },
    });
  });

  it("no URL is no cover", () => {
    expect(
      shareCover({
        coverUrl: null,
        hotspot: null,
        crop: null,
        dimensions: null,
      }),
    ).toBeNull();
  });
});
