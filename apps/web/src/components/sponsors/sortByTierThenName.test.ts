import { describe, it, expect } from "vitest";
import { sortByTierThenName } from "./sortByTierThenName";
import type { Sponsor } from "./Sponsors";

const make = (name: string, tier?: Sponsor["tier"]): Sponsor => ({
  id: name,
  name,
  logo: "",
  tier,
});

describe("sortByTierThenName", () => {
  it("orders hoofdsponsor before sponsor before sympathisant", () => {
    const input = [
      make("Z", "sympathisant"),
      make("A", "sponsor"),
      make("M", "hoofdsponsor"),
    ];
    const sorted = [...input].sort(sortByTierThenName).map((s) => s.name);
    expect(sorted).toEqual(["M", "A", "Z"]);
  });

  it("sorts alphabetically (nl locale) within a tier", () => {
    const input = [
      make("Garage Vermeulen", "hoofdsponsor"),
      make("Bakkerij Peeters", "hoofdsponsor"),
    ];
    const sorted = [...input].sort(sortByTierThenName).map((s) => s.name);
    expect(sorted).toEqual(["Bakkerij Peeters", "Garage Vermeulen"]);
  });

  it("treats untiered sponsors as the sponsor tier", () => {
    const input = [
      make("Untiered"),
      make("Hoofd", "hoofdsponsor"),
      make("Symp", "sympathisant"),
    ];
    const sorted = [...input].sort(sortByTierThenName).map((s) => s.name);
    expect(sorted).toEqual(["Hoofd", "Untiered", "Symp"]);
  });
});
