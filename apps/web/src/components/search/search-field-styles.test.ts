/**
 * search-field-styles Tests
 *
 * The `/zoeken` shell shares the field skin of `<Input>` (#3337): cream,
 * 2px ink border, the shared `--shadow-paper-sm` (4px) — not a bespoke 5px.
 */

import { describe, it, expect } from "vitest";
import { searchFieldShellClasses } from "./search-field-styles";

describe("searchFieldShellClasses", () => {
  it("rests on cream with a 2px ink border and the shared paper-sm shadow", () => {
    const classes = searchFieldShellClasses.split(" ");
    expect(classes).toEqual(
      expect.arrayContaining([
        "bg-cream",
        "border-ink",
        "border-2",
        "shadow-[var(--shadow-paper-sm)]",
      ]),
    );
  });

  it("carries no hand-written shadow offset", () => {
    expect(searchFieldShellClasses).not.toContain("5px_5px");
  });
});
