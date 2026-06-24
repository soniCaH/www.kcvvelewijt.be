import { describe, it, expect } from "vitest";

import manifest from "./manifest";
import { BRAND } from "@/lib/constants";

describe("manifest.ts", () => {
  const result = manifest();

  // ICON-1 — a 192×192 "any" icon plus dedicated padded maskable artwork
  // (no longer the 512 "any" icon reused, which Android crops).
  it("ships a 192×192 any icon", () => {
    expect(result.icons).toContainEqual(
      expect.objectContaining({ src: "/icon-192.png", sizes: "192x192" }),
    );
  });

  it("uses dedicated maskable artwork, not the any icon", () => {
    const maskable = (result.icons ?? []).filter((i) =>
      i.purpose?.includes("maskable"),
    );
    expect(maskable).toHaveLength(1);
    expect(maskable[0].src).toBe("/icon-maskable.png");
  });

  // ICON-2 — brand colors: jersey-deep theme, cream background.
  it("uses brand theme/background colors", () => {
    expect(result.theme_color).toBe(BRAND.primaryColor);
    expect(result.theme_color).toBe("#008755"); // jersey-deep
    expect(result.background_color).toBe(BRAND.backgroundColor);
    expect(result.background_color).toBe("#f5f1e6"); // cream
  });
});
