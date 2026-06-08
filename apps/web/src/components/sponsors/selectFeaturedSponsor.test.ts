import { describe, it, expect } from "vitest";
import { selectFeaturedSponsor } from "./selectFeaturedSponsor";
import type { Sponsor } from "./Sponsors";

const sponsor = (overrides: Partial<Sponsor> & { id: string }): Sponsor => ({
  name: `Sponsor ${overrides.id}`,
  logo: "",
  ...overrides,
});

describe("selectFeaturedSponsor", () => {
  it("returns null when no sponsor is featured", () => {
    const sponsors = [
      sponsor({ id: "1", tier: "hoofdsponsor" }),
      sponsor({ id: "2", tier: "sponsor", featured: false }),
    ];
    expect(selectFeaturedSponsor(sponsors)).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(selectFeaturedSponsor([])).toBeNull();
  });

  it("returns the only featured sponsor", () => {
    const target = sponsor({ id: "2", tier: "sponsor", featured: true });
    const sponsors = [
      sponsor({ id: "1", tier: "hoofdsponsor", featured: false }),
      target,
      sponsor({ id: "3", tier: "sympathisant" }),
    ];
    expect(selectFeaturedSponsor(sponsors)).toBe(target);
  });

  it("picks the highest tier among multiple featured sponsors", () => {
    const hoofd = sponsor({
      id: "h",
      name: "Zebra",
      tier: "hoofdsponsor",
      featured: true,
    });
    const sponsors = [
      sponsor({ id: "s", name: "Aardvark", tier: "sponsor", featured: true }),
      hoofd,
    ];
    // hoofdsponsor wins on tier even though its name sorts later.
    expect(selectFeaturedSponsor(sponsors)).toBe(hoofd);
  });

  it("ranks untiered sponsors last", () => {
    const sympathisant = sponsor({
      id: "sym",
      name: "Zztop",
      tier: "sympathisant",
      featured: true,
    });
    const sponsors = [
      sponsor({ id: "untiered", name: "Aaa", featured: true }),
      sympathisant,
    ];
    // sympathisant outranks an untiered sponsor despite the later name.
    expect(selectFeaturedSponsor(sponsors)).toBe(sympathisant);
  });

  it("breaks ties on the same tier by name (nl locale)", () => {
    const sponsors = [
      sponsor({ id: "b", name: "Énergie", tier: "sponsor", featured: true }),
      sponsor({ id: "a", name: "Apotheek", tier: "sponsor", featured: true }),
    ];
    expect(selectFeaturedSponsor(sponsors)?.id).toBe("a");
  });

  it("ignores sponsors whose featured flag is falsy", () => {
    const featured = sponsor({ id: "f", tier: "sponsor", featured: true });
    const sponsors = [
      sponsor({ id: "1", tier: "hoofdsponsor" }),
      sponsor({ id: "2", tier: "hoofdsponsor", featured: false }),
      featured,
    ];
    expect(selectFeaturedSponsor(sponsors)).toBe(featured);
  });
});
