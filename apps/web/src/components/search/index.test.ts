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

  it("should export SearchForm component", () => {
    expect(SearchModule.SearchForm).toBeDefined();
    expect(typeof SearchModule.SearchForm).toBe("function");
  });

  it("should export SearchMasthead component", () => {
    expect(SearchModule.SearchMasthead).toBeDefined();
    expect(typeof SearchModule.SearchMasthead).toBe("function");
  });

  it("should export SearchFilters component", () => {
    expect(SearchModule.SearchFilters).toBeDefined();
    expect(typeof SearchModule.SearchFilters).toBe("function");
  });

  it("should export SearchResults component", () => {
    expect(SearchModule.SearchResults).toBeDefined();
    expect(typeof SearchModule.SearchResults).toBe("function");
  });

  it("should export SearchResult component", () => {
    expect(SearchModule.SearchResult).toBeDefined();
    expect(typeof SearchModule.SearchResult).toBe("function");
  });

  it("should only export the expected public surface", () => {
    const exportedKeys = Object.keys(SearchModule).sort();
    expect(exportedKeys).toEqual([
      "SearchFilters",
      "SearchForm",
      "SearchInterface",
      "SearchMasthead",
      "SearchResult",
      "SearchResults",
    ]);
  });
});
