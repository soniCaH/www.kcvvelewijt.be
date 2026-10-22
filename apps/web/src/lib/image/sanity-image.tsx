"use client";

import Image, { type ImageProps } from "next/image";
import { isSanityImageUrl, sanityImageLoader } from "./sanity-image-loader";

/**
 * `next/image` with {@link sanityImageLoader} for Sanity sources. Any other
 * `src` keeps Next's default loader (quality allowlist, deployment id, SVG
 * rules), so a slot that mixes Sanity and local sources stays safe. A loader
 * function cannot cross the server→client boundary, hence this client
 * wrapper. Not a global `images.loaderFile`: that turns `/_next/image` into a
 * 404, which the local photos and the share capture's same-origin proxy still
 * need (#3664).
 */
export function SanityImage({ alt, ...props }: ImageProps) {
  const loader =
    typeof props.src === "string" && isSanityImageUrl(props.src)
      ? sanityImageLoader
      : undefined;
  return <Image alt={alt} {...props} loader={loader} />;
}
