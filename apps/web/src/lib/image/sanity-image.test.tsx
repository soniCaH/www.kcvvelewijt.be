import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SanityImage } from "./sanity-image";

const SANITY =
  "https://cdn.sanity.io/images/vhb33jaz/production/abc-1600x900.jpg?w=800&q=80&fm=webp";

const srcOf = (src: string) =>
  render(<SanityImage src={src} alt="" width={640} height={360} />)
    .container.querySelector("img")!
    .getAttribute("src");

describe("SanityImage", () => {
  it("asks Sanity's CDN for a Sanity source", () => {
    const src = srcOf(SANITY);

    expect(src).toMatch(/^https:\/\/cdn\.sanity\.io\/images\/vhb33jaz\//);
    expect(src).toContain("auto=format");
  });

  it("leaves any other source on Next's default loader", () => {
    expect(srcOf("/images/ultras.jpg")).toMatch(
      /^\/_next\/image\?url=%2Fimages%2Fultras\.jpg&w=\d+&q=75$/,
    );
  });
});
