import { describe, it, expect } from "vitest";
import { readSponsorAttrs } from "./sponsor-attrs";

const el = (attrs: Record<string, string>): HTMLElement => {
  const node = document.createElement("a");
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

describe("readSponsorAttrs", () => {
  it("reads the id and tier", () => {
    expect(
      readSponsorAttrs(
        el({ "data-sponsor-id": "s-1", "data-sponsor-tier": "hoofdsponsor" }),
      ),
    ).toEqual({ sponsorId: "s-1", tier: "hoofdsponsor" });
  });

  it("returns null when there is no sponsor id", () => {
    expect(readSponsorAttrs(el({ "data-banner-slot": "a" }))).toBeNull();
  });

  it("returns null on an empty sponsor id rather than an empty-string id", () => {
    expect(readSponsorAttrs(el({ "data-sponsor-id": "" }))).toBeNull();
  });

  it("coerces an absent tier to undefined, never an empty string", () => {
    expect(
      readSponsorAttrs(el({ "data-sponsor-id": "s-2" }))?.tier,
    ).toBeUndefined();
  });

  it("coerces an empty tier attribute to undefined", () => {
    expect(
      readSponsorAttrs(
        el({ "data-sponsor-id": "s-3", "data-sponsor-tier": "" }),
      )?.tier,
    ).toBeUndefined();
  });
});
