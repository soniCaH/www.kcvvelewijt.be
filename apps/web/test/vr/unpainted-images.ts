/**
 * Pure predicate behind the "image not painted at capture time" throw in
 * `.storybook/test-runner.ts`'s `postVisit` (#3466). The runner's image wait is
 * capped, and a cap that runs out used to fall through to `page.screenshot()`,
 * baselining (or failing against) a page with an empty photo tile.
 *
 * The page side (`collectImageSamples` in test-runner.ts) must be
 * self-contained — imported helpers do not exist in the page context — so it
 * only returns plain {@link ImageSample}s; the decision lives here so a Vitest
 * test can exercise it without a Playwright page.
 */
export interface ImageSample {
  /** `HTMLImageElement.currentSrc`, the URL named in the error message. */
  currentSrc: string;
  /** `getBoundingClientRect()` size. */
  width: number;
  height: number;
  /** Computed `display` / `visibility`. */
  display: string;
  visibility: string;
  complete: boolean;
  naturalWidth: number;
  /** `decode()` resolved: the bitmap is ready to paint. */
  decoded: boolean;
}

const isVisible = (sample: ImageSample) =>
  sample.width > 0 &&
  sample.height > 0 &&
  sample.display !== "none" &&
  sample.visibility !== "hidden";

/**
 * `currentSrc` of every visible image that is not loaded and decoded. An image
 * the viewer cannot see (zero box, `display:none`, `visibility:hidden`) never
 * counts, so a lazy image parked in a closed panel cannot fail a story.
 */
export function unpaintedImages(samples: readonly ImageSample[]): string[] {
  return samples
    .filter(
      (sample) =>
        isVisible(sample) &&
        !(sample.complete && sample.naturalWidth > 0 && sample.decoded),
    )
    .map((sample) => sample.currentSrc);
}
