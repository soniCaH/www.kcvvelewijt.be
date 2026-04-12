import { describe, expect, it } from "vitest";
import * as images from "./images";

const SANITY_CDN_PREFIX =
  "https://cdn.sanity.io/images/vhb33jaz/production/" as const;
const REQUIRED_PARAMS = ["q=80", "fm=webp", "fit=max"];

/** All exported image URL constants */
const allExports = Object.entries(images).filter(
  ([, value]) => typeof value === "string",
) as [string, string][];

describe("Sanity CDN image constants", () => {
  it("exports at least 11 image URLs (one per migrated file)", () => {
    // 11 source files, but some have multiple width variants (hero vs timeline vs card)
    expect(allExports.length).toBeGreaterThanOrEqual(11);
  });

  for (const [name, url] of allExports) {
    describe(name, () => {
      it("points to Sanity CDN production", () => {
        expect(url).toContain(SANITY_CDN_PREFIX);
      });

      it("includes all required transform params", () => {
        for (const param of REQUIRED_PARAMS) {
          expect(url, `missing ${param}`).toContain(param);
        }
      });

      it("includes a width param", () => {
        expect(url).toMatch(/\?w=\d+/);
      });
    });
  }

  it("hero images use w=1600", () => {
    expect(images.HISTORY_24_25_HERO).toMatch(/[?&]w=1600(&|$)/);
    expect(images.ULTRAS_HEADER_HERO).toMatch(/[?&]w=1600(&|$)/);
  });

  it("timeline images use w=1024", () => {
    expect(images.HISTORY_52_53).toMatch(/[?&]w=1024(&|$)/);
    expect(images.HISTORY_58_59).toMatch(/[?&]w=1024(&|$)/);
    expect(images.HISTORY_63_64).toMatch(/[?&]w=1024(&|$)/);
    expect(images.HISTORY_FUSIE).toMatch(/[?&]w=1024(&|$)/);
    expect(images.HISTORY_BVB).toMatch(/[?&]w=1024(&|$)/);
    expect(images.HISTORY_2018).toMatch(/[?&]w=1024(&|$)/);
    expect(images.HISTORY_2022).toMatch(/[?&]w=1024(&|$)/);
    expect(images.HISTORY_24_25).toMatch(/[?&]w=1024(&|$)/);
  });

  it("editorial card images use w=900", () => {
    expect(images.HISTORY_24_25_CARD).toMatch(/[?&]w=900(&|$)/);
    expect(images.ULTRAS_HEADER_CARD).toMatch(/[?&]w=900(&|$)/);
  });

  it("ultras content images use w=1440", () => {
    expect(images.ULTRAS_KAMPIOEN).toMatch(/[?&]w=1440(&|$)/);
    expect(images.ULTRAS_SJR).toMatch(/[?&]w=1440(&|$)/);
  });
});
