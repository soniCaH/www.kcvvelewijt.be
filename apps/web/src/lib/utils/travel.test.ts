import { describe, expect, it } from "vitest";
import { TRAVEL_CLASS, travelName, travelSlug } from "./travel";

describe("travelName", () => {
  it("names the end after its kind and id, so only the same kind + id pair", () => {
    expect(travelName("match", 42)).toBe("match-travel-42");
    expect(travelName("article", "winst-in-mechelen")).toBe(
      "article-travel-winst-in-mechelen",
    );
    expect(travelName("player", "a1")).not.toBe(travelName("article", "a1"));
  });

  it("keeps the name a valid CSS identifier whatever the id holds", () => {
    expect(travelName("player", "drafts.a b/ç")).toBe(
      "player-travel-drafts_a_b__",
    );
  });
});

describe("travelSlug", () => {
  it.each([
    ["article", "/nieuws/winst-in-mechelen", "winst-in-mechelen"],
    ["player", "/spelers/jan-peeters", "jan-peeters"],
  ] as const)("reads the %s slug off %s", (kind, href, slug) => {
    expect(travelSlug(kind, href)).toBe(slug);
  });

  it.each([
    ["article", undefined],
    ["article", ""],
    ["article", "/nieuws"],
    ["article", "/nieuws/"],
    ["article", "/nieuws?categorie=jeugd"],
    ["article", "/nieuws/a/b"],
    ["article", "/nieuws/a?x=1"],
    ["article", "/nieuws/a#top"],
    ["article", "/galerij/a"],
    ["article", "/spelers/a"],
    ["player", "/staf/a"],
    ["player", "/nieuws/a"],
    ["player", "https://example.com/spelers/a"],
  ] as const)("finds no %s slug in %s", (kind, href) => {
    expect(travelSlug(kind, href)).toBeUndefined();
  });
});

it("exposes the one class the CSS block is keyed on", () => {
  expect(TRAVEL_CLASS).toBe("travel");
});
