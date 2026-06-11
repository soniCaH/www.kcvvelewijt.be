import { describe, it, expect } from "vitest";
import {
  ACCENT_GLYPH_CLASS,
  CATEGORY_META,
  CATEGORY_ORDER,
  groupPathsByCategory,
} from "./categoryMeta";
import type { ResponsibilityPath } from "@/types/responsibility";

function mk(id: string, category: ResponsibilityPath["category"]) {
  return {
    id,
    category,
    role: [],
    question: id,
    keywords: [],
    summary: "",
    steps: [],
    primaryContact: { contactType: "manual" },
  } as ResponsibilityPath;
}

describe("categoryMeta", () => {
  it("has a label + Phosphor icon for every category", () => {
    for (const key of CATEGORY_ORDER) {
      expect(CATEGORY_META[key].label.length).toBeGreaterThan(0);
      expect(CATEGORY_META[key].icon).toBeTypeOf("function");
    }
  });

  it("gives only Medisch the brick accent; every other category is ink (7o6c · 1)", () => {
    expect(CATEGORY_META.medisch.accent).toBe("brick");
    for (const key of CATEGORY_ORDER) {
      if (key !== "medisch") expect(CATEGORY_META[key].accent).toBe("ink");
    }
  });

  it("maps the brick accent to the semantic alert glyph class", () => {
    expect(ACCENT_GLYPH_CLASS.brick).toBe("text-alert");
    expect(ACCENT_GLYPH_CLASS.ink).toBe("text-ink");
  });

  it("orders categories Medisch-first and covers all six", () => {
    expect(CATEGORY_ORDER[0]).toBe("medisch");
    expect(new Set(CATEGORY_ORDER).size).toBe(6);
  });

  it("groups paths by category, preserving input order with empty arrays for gaps", () => {
    const grouped = groupPathsByCategory([
      mk("a", "medisch"),
      mk("b", "sportief"),
      mk("c", "medisch"),
    ]);
    expect(grouped.medisch.map((p) => p.id)).toEqual(["a", "c"]);
    expect(grouped.sportief.map((p) => p.id)).toEqual(["b"]);
    expect(grouped.commercieel).toEqual([]);
  });
});
