import { describe, it, expect } from "vitest";
import {
  buildArticleIndexText,
  buildPageIndexText,
  buildResponsibilityIndexText,
} from "./index-text";

describe("buildResponsibilityIndexText", () => {
  it("combines title, question, keywords, and summary", () => {
    const result = buildResponsibilityIndexText({
      title: "Kantine & evenementen",
      question: "wie regelt de kantine",
      keywords: ["kantine", "bar", "evenementen"],
      summary: "De kantine wordt beheerd door de evenementencommissie.",
    });

    expect(result).toContain("Kantine & evenementen");
    expect(result).toContain("wie regelt de kantine");
    expect(result).toContain("kantine bar evenementen");
    expect(result).toContain("De kantine wordt beheerd");
  });
});

describe("buildArticleIndexText", () => {
  it("combines title, tags, and body text", () => {
    const result = buildArticleIndexText({
      title: "Verslag: KCVV wint derby",
      tags: ["verslag", "derby"],
      bodyText: "KCVV Elewijt won de derby met 3-1.",
    });

    expect(result).toContain("Verslag: KCVV wint derby");
    expect(result).toContain("verslag derby");
    expect(result).toContain("KCVV Elewijt won de derby met 3-1.");
  });

  it("handles null body text gracefully", () => {
    const result = buildArticleIndexText({
      title: "Kort bericht",
      tags: ["nieuws"],
      bodyText: null,
    });

    expect(result).toContain("Kort bericht");
    expect(result).toContain("nieuws");
    expect(result).not.toContain("null");
  });
});

describe("buildPageIndexText", () => {
  it("combines title and body text", () => {
    const result = buildPageIndexText({
      title: "Over KCVV Elewijt",
      bodyText: "KCVV Elewijt is een voetbalclub uit Elewijt.",
    });

    expect(result).toContain("Over KCVV Elewijt");
    expect(result).toContain("KCVV Elewijt is een voetbalclub uit Elewijt.");
  });

  it("handles null body text gracefully", () => {
    const result = buildPageIndexText({
      title: "Lege pagina",
      bodyText: null,
    });

    expect(result).toBe("Lege pagina");
  });
});
