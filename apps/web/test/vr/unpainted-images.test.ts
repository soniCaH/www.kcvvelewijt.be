/**
 * Regression fixture for the "image not painted at capture time" throw in
 * `.storybook/test-runner.ts`'s `postVisit` (#3466). The decision
 * (`unpaintedImages`, in `unpainted-images.ts`) is pure so it is exercised
 * here without a Playwright page.
 */
import { describe, expect, it } from "vitest";
import { unpaintedImages, type ImageSample } from "./unpainted-images";

const sample = (over: Partial<ImageSample>): ImageSample => ({
  currentSrc: "https://cdn.test/photo.jpg?__vr=tablet",
  width: 320,
  height: 200,
  display: "block",
  visibility: "visible",
  complete: true,
  naturalWidth: 1200,
  decoded: true,
  ...over,
});

describe("unpaintedImages", () => {
  it("reports nothing for a painted image", () => {
    expect(unpaintedImages([sample({})])).toEqual([]);
  });

  it("reports an incomplete visible image by its currentSrc", () => {
    expect(unpaintedImages([sample({ complete: false })])).toEqual([
      "https://cdn.test/photo.jpg?__vr=tablet",
    ]);
  });

  it("reports a visible image whose naturalWidth is 0 (broken)", () => {
    expect(unpaintedImages([sample({ naturalWidth: 0 })])).toHaveLength(1);
  });

  it("reports a loaded visible image that has not decoded", () => {
    expect(unpaintedImages([sample({ decoded: false })])).toHaveLength(1);
  });

  it.each([
    ["zero width", { width: 0 }],
    ["zero height", { height: 0 }],
    ["display:none", { display: "none" }],
    ["visibility:hidden", { visibility: "hidden" }],
  ] as const)(
    "ignores an unpainted image that is not visible (%s)",
    (_, over) => {
      expect(
        unpaintedImages([
          sample({ ...over, complete: false, naturalWidth: 0, decoded: false }),
        ]),
      ).toEqual([]);
    },
  );

  it("lists every pending image and skips the painted ones", () => {
    expect(
      unpaintedImages([
        sample({ currentSrc: "a.jpg", complete: false }),
        sample({ currentSrc: "b.jpg" }),
        sample({ currentSrc: "c.jpg", naturalWidth: 0 }),
      ]),
    ).toEqual(["a.jpg", "c.jpg"]);
  });
});
