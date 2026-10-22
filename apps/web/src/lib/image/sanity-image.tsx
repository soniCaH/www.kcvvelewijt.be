"use client";

import Image, { type ImageProps } from "next/image";
import { sanityImageLoader } from "./sanity-image-loader";

/**
 * `next/image` with {@link sanityImageLoader}. A loader function cannot cross
 * the server→client boundary, hence this client wrapper. Not a global
 * `images.loaderFile`: that turns `/_next/image` into a 404, which the local
 * photos and the share capture's same-origin proxy still need (#3664).
 */
export function SanityImage({ alt, ...props }: ImageProps) {
  return <Image alt={alt} {...props} loader={sanityImageLoader} />;
}
