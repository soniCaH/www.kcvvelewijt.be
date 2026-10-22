import type { ImageLoaderProps } from "next/image";

// Same project pin as `next.config.ts`'s `remotePatterns` (prod and staging share it).
const SANITY_PREFIX = "https://cdn.sanity.io/images/vhb33jaz/";
const DEFAULT_QUALITY = 75;

export const isSanityImageUrl = (src: string): boolean =>
  src.startsWith(SANITY_PREFIX);

/**
 * `next/image` loader that lets Sanity's image pipeline cut every `srcset`
 * width (#3664), so Sanity photos never reach Vercel's metered optimizer.
 * Only for {@link isSanityImageUrl} sources — `SanityImage` leaves every other
 * `src` on Next's default loader.
 *
 * The GROQ-built params (`fit`, `crop`, `fp-x`, `rect`, …) are kept as the
 * crop input; only the width moves, and `h` scales with it so a crop keeps its
 * shape.
 */
export function sanityImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  const url = new URL(src);
  const params = url.searchParams;
  const sourceWidth = Number(params.get("w"));
  const sourceHeight = Number(params.get("h"));

  if (sourceWidth > 0) {
    if (sourceHeight > 0) {
      params.set("h", String(Math.round((sourceHeight * width) / sourceWidth)));
    }
  } else if (!params.has("fit")) {
    // A raw original: never upscale. An explicit fit (`crop`) stays.
    params.set("fit", "max");
  }
  params.set("w", String(width));
  params.delete("fm");
  params.set("auto", "format");
  params.set("q", String(quality ?? params.get("q") ?? DEFAULT_QUALITY));

  return url.toString();
}
