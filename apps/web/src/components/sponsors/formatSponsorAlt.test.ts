import { describe, it, expect } from "vitest";
import { formatSponsorAlt } from "./formatSponsorAlt";

describe("formatSponsorAlt", () => {
  it("includes the sponsor name and the club name so screen readers and broken-image fallback announce the sponsor", () => {
    expect(formatSponsorAlt("Acme")).toBe("Acme — sponsor KCVV Elewijt");
  });

  it("preserves diacritics and ampersands in sponsor names", () => {
    expect(formatSponsorAlt("Café & Bar")).toBe(
      "Café & Bar — sponsor KCVV Elewijt",
    );
  });
});
