// ponytail: minimal next/image → <img> shim for the design bundle.
// The claude.ai/design runtime has no Next optimizer; render a plain <img>.
import * as React from "react";

type Src = string | { src?: string; default?: { src?: string } };

export default function Image({
  src,
  alt = "",
  fill,
  width,
  height,
  // Next-only props — swallow so they never hit the DOM.
  priority,
  quality,
  loader,
  unoptimized,
  placeholder,
  blurDataURL,
  loading,
  sizes,
  style,
  ...rest
}: Record<string, unknown> & { src?: Src }) {
  const s = src as Src;
  const resolved =
    typeof s === "object" && s !== null ? (s.src ?? s.default?.src ?? "") : (s ?? "");
  const fillStyle = fill
    ? {
        position: "absolute" as const,
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
        ...(style as object),
      }
    : (style as object);
  return (
    <img
      src={resolved as string}
      alt={alt as string}
      width={fill ? undefined : (width as number | undefined)}
      height={fill ? undefined : (height as number | undefined)}
      sizes={sizes as string | undefined}
      style={fillStyle}
      {...rest}
    />
  );
}
