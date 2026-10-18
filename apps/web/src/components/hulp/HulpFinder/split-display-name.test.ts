import { describe, expect, it } from "vitest";
import { splitDisplayName } from "./split-display-name";

describe("splitDisplayName", () => {
  it("splits first token (lead) from the remainder (rest)", () => {
    expect(splitDisplayName("Luc Boons")).toEqual({
      lead: "Luc",
      rest: "Boons",
    });
    expect(splitDisplayName("Jan De Smet")).toEqual({
      lead: "Jan",
      rest: "De Smet",
    });
  });

  it("returns an empty rest for a single token", () => {
    expect(splitDisplayName("Penningmeester")).toEqual({
      lead: "Penningmeester",
      rest: "",
    });
  });

  it("tolerates extra whitespace and empty input", () => {
    expect(splitDisplayName("  Els   Vos  ")).toEqual({
      lead: "Els",
      rest: "Vos",
    });
    expect(splitDisplayName("")).toEqual({ lead: "", rest: "" });
  });
});
