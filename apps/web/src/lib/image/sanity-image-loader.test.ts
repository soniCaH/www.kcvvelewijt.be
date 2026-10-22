import { describe, expect, it } from "vitest";
import { sanityImageLoader } from "./sanity-image-loader";

const BASE =
  "https://cdn.sanity.io/images/vhb33jaz/production/abc-1600x900.jpg";

const params = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe("sanityImageLoader", () => {
  it.each([
    {
      name: "pre-sized Sanity URL: width replaces w, fm becomes auto=format, URL q kept",
      src: `${BASE}?w=800&q=80&fm=webp`,
      width: 1200,
      quality: undefined,
      expected: { w: "1200", q: "80", auto: "format" },
    },
    {
      name: "crop keeps every param and scales h to keep the aspect ratio",
      src: `${BASE}?w=800&h=450&fit=crop&crop=focalpoint&fp-x=0.3&fp-y=0.7&rect=10,20,1000,600`,
      width: 1080,
      quality: undefined,
      expected: {
        w: "1080",
        h: "608",
        fit: "crop",
        crop: "focalpoint",
        "fp-x": "0.3",
        "fp-y": "0.7",
        rect: "10,20,1000,600",
        auto: "format",
        q: "75",
      },
    },
    {
      name: "quality prop beats the URL's q",
      src: `${BASE}?w=800&q=80`,
      width: 640,
      quality: 60,
      expected: { w: "640", q: "60", auto: "format" },
    },
    {
      name: "raw original gets w, fit=max and auto=format",
      src: BASE,
      width: 384,
      quality: undefined,
      expected: { w: "384", fit: "max", auto: "format", q: "75" },
    },
  ])("$name", ({ src, width, quality, expected }) => {
    const out = sanityImageLoader({ src, width, quality });

    expect(out.startsWith(`${BASE}?`)).toBe(true);
    expect(params(out)).toEqual(expected);
  });

  it.each([
    ["/images/logo.png"],
    ["https://dfaozfi7c7f3s.cloudfront.net/photo.jpg"],
    ["https://cdn.sanity.io/images/otherproj/production/x.jpg?w=800"],
  ])("falls back to Next's own optimizer for %s", (src) => {
    expect(sanityImageLoader({ src, width: 640 })).toBe(
      `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`,
    );
    expect(sanityImageLoader({ src, width: 640, quality: 50 })).toBe(
      `/_next/image?url=${encodeURIComponent(src)}&w=640&q=50`,
    );
  });
});
