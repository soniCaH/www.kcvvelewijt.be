/**
 * Search Component Index Export Tests
 * Validates that all components are properly exported
 */

import { describe, it, expect } from "vitest";
import * as SearchModule from "./index";

describe("search/index exports", () => {
  it("should export SearchInterface component", () => {
    expect(SearchModule.SearchInterface).toBeDefined();
    expect(typeof SearchModule.SearchInterface).toBe("function");
  });

  it("should only export the expected public surface", () => {
    const exportedKeys = Object.keys(SearchModule).sort();
    expect(exportedKeys).toEqual(["SearchInterface"]);
  });
});
