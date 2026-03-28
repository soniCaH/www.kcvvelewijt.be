import { describe, it, expect } from "vitest";
import { Schema as S } from "effect";
import {
  PsdMember,
  PsdMembersPageSchema,
  PsdTeam,
  PsdTeamsSchema,
} from "./schemas-player-team";

describe("PsdMember schema", () => {
  const validPlayer = {
    id: 6453,
    firstName: "Alexander",
    lastName: "Bell",
    birthDate: "1993-11-29 00:00",
    nationality: null,
    profilePictureURL:
      "/api/v2/members/profilepicture/6453?profileAccessKey=abc123",
    keeper: false,
    bestPosition: null,
    active: true,
    status: "speler",
    functionTitle: null,
  };

  const validStaff = {
    id: 252,
    firstName: "Tom",
    lastName: "Bautmans",
    birthDate: "1989-06-05 00:00",
    nationality: "Belgium",
    profilePictureURL:
      "/api/v2/members/profilepicture/252?profileAccessKey=def456",
    keeper: false,
    bestPosition: null,
    active: true,
    status: "staff",
    functionTitle: "Keeperstrainer",
  };

  it("decodes a valid player member", () => {
    const result = S.decodeUnknownSync(PsdMember)(validPlayer);
    expect(result.id).toBe(6453);
    expect(result.firstName).toBe("Alexander");
    expect(result.keeper).toBe(false);
    expect(result.functionTitle).toBeNull();
  });

  it("decodes a valid staff member", () => {
    const result = S.decodeUnknownSync(PsdMember)(validStaff);
    expect(result.id).toBe(252);
    expect(result.functionTitle).toBe("Keeperstrainer");
    expect(result.status).toBe("staff");
  });

  it("fails on missing required id", () => {
    expect(() =>
      S.decodeUnknownSync(PsdMember)({ firstName: "Jan" }),
    ).toThrow();
  });

  it("decodes a paginated members response", () => {
    const page = {
      content: [validPlayer, validStaff],
      totalElements: 2,
      totalPages: 1,
    };
    const result = S.decodeUnknownSync(PsdMembersPageSchema)(page);
    expect(result.content).toHaveLength(2);
    expect(result.totalElements).toBe(2);
  });
});

describe("PsdTeam schema", () => {
  const validTeam = {
    id: 1,
    name: "Eerste Elftallen A",
    age: "A",
    gender: "mannen",
    footbelId: 183904,
    active: true,
  };

  it("decodes a valid team", () => {
    const result = S.decodeUnknownSync(PsdTeam)(validTeam);
    expect(result.id).toBe(1);
    expect(result.name).toBe("Eerste Elftallen A");
    expect(result.footbelId).toBe(183904);
  });

  it("decodes a team with null footbelId (youth teams)", () => {
    const result = S.decodeUnknownSync(PsdTeam)({
      ...validTeam,
      footbelId: null,
    });
    expect(result.footbelId).toBeNull();
  });

  it("fails on missing required id", () => {
    expect(() => S.decodeUnknownSync(PsdTeam)({ name: "Test" })).toThrow();
  });

  it("decodes teams array", () => {
    const result = S.decodeUnknownSync(PsdTeamsSchema)([validTeam]);
    expect(result).toHaveLength(1);
  });
});
