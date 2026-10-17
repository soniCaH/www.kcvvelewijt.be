import { describe, expect, it } from "vitest";
import { safeDecodeURIComponent } from "./safe-decode";

describe("safeDecodeURIComponent", () => {
  it("decodes a valid escape", () => {
    expect(safeDecodeURIComponent("caf%C3%A9")).toBe("café");
  });

  it("keeps a trailing lone %", () => {
    expect(safeDecodeURIComponent("100%")).toBe("100%");
  });

  it("keeps a malformed UTF-8 escape", () => {
    expect(safeDecodeURIComponent("%E0")).toBe("%E0");
  });
});
