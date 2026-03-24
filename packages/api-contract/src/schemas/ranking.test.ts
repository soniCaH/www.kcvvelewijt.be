import { describe, it, expect } from "vitest";
import { Schema as S } from "effect";
import { RankingEntry, RankingArray } from "./ranking";

const validEntry = {
  position: 1,
  team_id: 42,
  team_name: "KCVV Elewijt",
  team_logo: "/logo.png",
  played: 20,
  won: 14,
  drawn: 3,
  lost: 3,
  goals_for: 45,
  goals_against: 18,
  goal_difference: 27,
  points: 45,
  form: "WWDLW",
};

describe("RankingEntry schema", () => {
  it("decodes a valid RankingEntry", () => {
    const result = S.decodeUnknownSync(RankingEntry)(validEntry);
    expect(result.position).toBe(1);
    expect(result.team_name).toBe("KCVV Elewijt");
    expect(result.points).toBe(45);
  });

  it("decodes without optional fields", () => {
    const { team_logo: _, form: __, ...minimal } = validEntry;
    const result = S.decodeUnknownSync(RankingEntry)(minimal);
    expect(result.team_logo).toBeUndefined();
    expect(result.form).toBeUndefined();
  });

  it("throws on missing required field", () => {
    const { points: _, ...noPoints } = validEntry;
    expect(() => S.decodeUnknownSync(RankingEntry)(noPoints)).toThrow();
  });
});

describe("RankingArray schema", () => {
  it("decodes a valid RankingArray", () => {
    const result = S.decodeUnknownSync(RankingArray)([validEntry]);
    expect(result).toHaveLength(1);
    expect(result[0].position).toBe(1);
  });

  it("decodes an empty array", () => {
    const result = S.decodeUnknownSync(RankingArray)([]);
    expect(result).toHaveLength(0);
  });
});
