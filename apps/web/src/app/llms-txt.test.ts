import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const llmsTxt = readFileSync(join(__dirname, "../../public/llms.txt"), "utf-8");

describe("llms.txt", () => {
  it("contains club identity block", () => {
    expect(llmsTxt).toContain("KCVV Elewijt");
    expect(llmsTxt).toContain("stamnummer 55");
    expect(llmsTxt).toContain("Er is maar één plezante compagnie");
    expect(llmsTxt).toContain("1924");
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
