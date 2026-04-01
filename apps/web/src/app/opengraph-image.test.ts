import { describe, it, expect } from "vitest";

describe("default opengraph-image", () => {
  it("exports size as 1200x630", async () => {
    const { size } = await import("./opengraph-image");
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it("exports contentType as image/png", async () => {
    const { contentType } = await import("./opengraph-image");
    expect(contentType).toBe("image/png");
  });

  it("default export returns a Response", async () => {
    const { default: Image } = await import("./opengraph-image");
    const response = await Image();
    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("content-type")).toContain("image/png");
  });
});
