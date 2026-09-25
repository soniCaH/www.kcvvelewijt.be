import { describe, it, expect } from "vitest";
import { resolveInternalLinkHref } from "./resolve-internal-link-href";

describe("resolveInternalLinkHref", () => {
  it("resolves a player by psdId", () => {
    expect(resolveInternalLinkHref({ _type: "player", psdId: "42" })).toBe(
      "/spelers/42",
    );
  });

  it("resolves a staff member by psdId", () => {
    expect(resolveInternalLinkHref({ _type: "staffMember", psdId: "7" })).toBe(
      "/staf/7",
    );
  });

  it("resolves a team by slug", () => {
    expect(
      resolveInternalLinkHref({ _type: "team", slug: "eerste-ploeg" }),
    ).toBe("/ploegen/eerste-ploeg");
  });

  it("resolves an article by slug", () => {
    expect(
      resolveInternalLinkHref({ _type: "article", slug: "een-artikel" }),
    ).toBe("/nieuws/een-artikel");
  });

  it("resolves a page by slug", () => {
    expect(
      resolveInternalLinkHref({ _type: "page", slug: "geschiedenis" }),
    ).toBe("/club/geschiedenis");
  });

  it("returns null when the identifier the target route needs is missing", () => {
    expect(resolveInternalLinkHref({ _type: "player" })).toBeNull();
    expect(resolveInternalLinkHref({ _type: "team" })).toBeNull();
  });

  it("returns null for an archived team, even with a slug", () => {
    expect(
      resolveInternalLinkHref({
        _type: "team",
        slug: "oud-elftal",
        archived: true,
      }),
    ).toBeNull();
  });

  it("resolves a non-archived team with a slug", () => {
    expect(
      resolveInternalLinkHref({
        _type: "team",
        slug: "eerste-ploeg",
        archived: false,
      }),
    ).toBe("/ploegen/eerste-ploeg");
  });

  it("returns null for an unrecognised reference type", () => {
    expect(resolveInternalLinkHref({ _type: "sponsor" })).toBeNull();
  });

  it("returns null for an undefined reference", () => {
    expect(resolveInternalLinkHref(undefined)).toBeNull();
  });
});
