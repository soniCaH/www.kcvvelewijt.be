import { describe, it, expect } from "vitest";
import { SITE_CONFIG } from "@/lib/constants";

describe("root layout metadata", () => {
  it("SITE_CONFIG.siteUrl is a valid absolute URL for metadataBase", () => {
    const url = new URL(SITE_CONFIG.siteUrl);
    expect(url.href).toBe("https://www.kcvvelewijt.be/");
  });

  it("SITE_CONFIG.twitterHandle is configured for twitter cards", () => {
    expect(SITE_CONFIG.twitterHandle).toBe("kcvve");
  });
});
