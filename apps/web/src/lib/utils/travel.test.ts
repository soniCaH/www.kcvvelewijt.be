import { describe, expect, it } from "vitest";
import { TRAVEL_CLASS, travelName, travelId } from "./travel";

describe("travelName", () => {
  it("names the end after its kind and id, so only the same kind + id pair", () => {
    expect(travelName("match", 42)).toBe("match-travel-42");
    expect(travelName("article", "winst-in-mechelen")).toBe(
      "article-travel-winst-in-mechelen",
    );
    expect(travelName("player", "a1")).not.toBe(travelName("article", "a1"));
  });

  it("names a percent-encoded route param and its decoded form alike", () => {
    expect(travelName("article", "caf%C3%A9-2024")).toBe(
      travelName("article", "café-2024"),
    );
    expect(travelName("article", "100%-winst")).toBe(
      "article-travel-100_-winst",
    );
  });

  it("keeps the name a valid CSS identifier whatever the id holds", () => {
    expect(travelName("player", "drafts.a b/ç")).toBe(
      "player-travel-drafts_a_b__",
    );
  });
});

describe("travelId", () => {
  it.each([
    ["article", "/nieuws/winst-in-mechelen", "winst-in-mechelen"],
    ["player", "/spelers/jan-peeters", "jan-peeters"],
    ["match", "/wedstrijd/42", "42"],
  ] as const)("reads the %s slug off %s", (kind, href, slug) => {
    expect(travelId(kind, href)).toBe(slug);
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
    ["match", "/wedstrijd"],
    ["match", "/spelers/42"],
    ["player", "/nieuws/a"],
    ["player", "https://example.com/spelers/a"],
  ] as const)("finds no %s slug in %s", (kind, href) => {
    expect(travelId(kind, href)).toBeUndefined();
  });
});

it("exposes the one class the CSS block is keyed on", () => {
  expect(TRAVEL_CLASS).toBe("travel");
});
