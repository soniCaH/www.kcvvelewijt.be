import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const llmsTxt = readFileSync(join(__dirname, "../../public/llms.txt"), "utf-8");

describe("llms.txt", () => {
  it("contains club identity block", () => {
    expect(llmsTxt).toContain("KCVV Elewijt");
    expect(llmsTxt).toContain("stamnummer 55");
    expect(llmsTxt).toContain("Er is maar 1 plezante compagnie");
  });

  // This file is repeated verbatim by systems that will never read
  // /club/geschiedenis, so the origin travels with its qualification (#2435).
  it("qualifies the club's origin instead of asserting a founding year", () => {
    expect(llmsTxt).not.toMatch(/opgericht in \d{4}/i);
    expect(llmsTxt).toMatch(/ontstaan uit fusies/i);
  });

  it("contains factual summary", () => {
    expect(llmsTxt).toContain("Elewijt");
    expect(llmsTxt).toContain("Zemst");
  });

  it("contains navigation index with top-level routes", () => {
    expect(llmsTxt).toContain("/nieuws");
    expect(llmsTxt).toContain("/ploegen");
    expect(llmsTxt).toContain("/kalender");
    expect(llmsTxt).toContain("/sponsors");
    expect(llmsTxt).toContain("/club");
    expect(llmsTxt).toContain("/galerij");
    // `/inhoud` is the derived twin of this hand-written list — the list that
    // once shipped `/club/organigram` months after the route was deleted.
    expect(llmsTxt).toContain("/inhoud");
  });

  it("contains content types", () => {
    expect(llmsTxt).toMatch(/news|artikel|article/i);
    expect(llmsTxt).toMatch(/match|wedstrijd/i);
    expect(llmsTxt).toMatch(/player|speler/i);
  });

  it("contains contact and social info", () => {
    expect(llmsTxt).toContain("facebook");
    expect(llmsTxt).toContain("Driesstraat");
  });

  it("states what the site does NOT contain", () => {
    expect(llmsTxt).toMatch(/not|geen|niet/i);
    expect(llmsTxt).toMatch(/ticket|betting|gok/i);
  });
});
