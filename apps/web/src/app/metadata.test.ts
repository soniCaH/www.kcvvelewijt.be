import { describe, it, expect } from "vitest";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { metadata } from "./layout";

describe("root layout metadata", () => {
  it("SITE_CONFIG.siteUrl is a valid absolute URL for metadataBase", () => {
    const url = new URL(SITE_CONFIG.siteUrl);
    expect(url.href).toBe("https://www.kcvvelewijt.be/");
  });

  it("SITE_CONFIG.twitterHandle is configured for twitter cards", () => {
    expect(SITE_CONFIG.twitterHandle).toBe("kcvve");
  });

  it("includes openGraph.images matching DEFAULT_OG_IMAGE in root metadata", () => {
    const og = metadata.openGraph as { images?: unknown[] };
    expect(og.images).toBeDefined();
    expect(og.images).toHaveLength(1);
    expect(og.images![0]).toEqual(DEFAULT_OG_IMAGE);
  });
});
