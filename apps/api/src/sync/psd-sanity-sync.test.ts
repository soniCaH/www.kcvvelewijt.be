import { describe, it, expect } from "vitest";
import {
  transformMember,
  transformTeam,
  transformStaff,
  partitionMembers,
} from "./psd-sanity-sync";
import type { PsdMember } from "@kcvv/api-contract";

const BASE_URL = "https://clubapi.prosoccerdata.com";

describe("transformMember (player)", () => {
  it("converts PSD member to Sanity player doc", () => {
    const psdMember = {
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
    const result = transformMember(psdMember, BASE_URL);
    expect(result.psdId).toBe("6453");
    expect(result.firstName).toBe("Alexander");
    expect(result.birthDate).toBe("1993-11-29"); // time stripped
    expect(result.keeper).toBe(false);
    // Query string stripped — profileAccessKey rotates per API call
    expect(result._psdImageUrl).toBe(
      `${BASE_URL}/api/v2/members/profilepicture/6453`,
    );
  });

  it("strips rotating profileAccessKey query param from image URL", () => {
    const result = transformMember(
      {
        id: 6453,
        firstName: "Alexander",
        lastName: "Bell",
        birthDate: null,
        nationality: null,
        profilePictureURL:
          "/api/v2/members/profilepicture/6453?profileAccessKey=newkey999",
        keeper: false,
        bestPosition: null,
        active: true,
        status: "speler",
        functionTitle: null,
      },
      BASE_URL,
    );
    expect(result._psdImageUrl).toBe(
      `${BASE_URL}/api/v2/members/profilepicture/6453`,
    );
  });

  it("handles null profilePictureURL", () => {
    const result = transformMember(
      {
        id: 1,
        firstName: "Jan",
        lastName: "Janssen",
        birthDate: null,
        nationality: "Belgium",
        profilePictureURL: null,
        keeper: true,
        bestPosition: null,
        active: true,
        status: "speler",
        functionTitle: null,
      },
      BASE_URL,
    );
    expect(result._psdImageUrl).toBeNull();
    expect(result.keeper).toBe(true);
  });

  it("extracts positionPsd from bestPosition object", () => {
    const result = transformMember(
      {
        id: 1,
        firstName: "Jan",
        lastName: "Janssen",
        birthDate: null,
        nationality: null,
        profilePictureURL: null,
        keeper: false,
        bestPosition: { type: { name: "Midfielder" } },
        active: true,
        status: "speler",
        functionTitle: null,
      },
      BASE_URL,
    );
    expect(result.positionPsd).toBe("Midfielder");
  });

  it("strips time component from birthDate", () => {
    const result = transformMember(
      {
        id: 1,
        firstName: "Jan",
        lastName: "Janssen",
        birthDate: "1989-06-05 00:00",
        nationality: null,
        profilePictureURL: null,
        keeper: false,
        bestPosition: null,
        active: true,
        status: "speler",
        functionTitle: null,
      },
      BASE_URL,
    );
    expect(result.birthDate).toBe("1989-06-05");
  });
});

const baseStaff: PsdMember = {
  id: 99,
  firstName: "Marc",
  lastName: "Peeters",
  birthDate: "1975-04-12 00:00",
  nationality: "Belgium",
  profilePictureURL: null,
  keeper: false,
  bestPosition: null,
  active: true,
  status: "staff",
  functionTitle: "T1",
};

describe("transformStaff", () => {
  it("maps PSD staff to SanityStaffDoc", () => {
    const result = transformStaff(baseStaff);
    expect(result.psdId).toBe("99");
    expect(result.firstName).toBe("Marc");
    expect(result.lastName).toBe("Peeters");
    expect(result.birthDate).toBe("1975-04-12");
    expect(result.positionShort).toBe("T1");
  });

  it("handles null functionTitle", () => {
    const result = transformStaff({ ...baseStaff, functionTitle: null });
    expect(result.positionShort).toBeUndefined();
  });

  it("accepts functionTitle of exactly 6 characters", () => {
    const result = transformStaff({ ...baseStaff, functionTitle: "T12345" });
    expect(result.positionShort).toBe("T12345");
  });

  it("sets positionShort to undefined when functionTitle exceeds 6 characters", () => {
    const result = transformStaff({
      ...baseStaff,
      functionTitle: "Jeugdcoördinator",
    });
    expect(result.positionShort).toBeUndefined();
  });

  it("handles null birthDate", () => {
    const result = transformStaff({ ...baseStaff, birthDate: null });
    expect(result.birthDate).toBeNull();
  });
});

describe("transformTeam", () => {
  it("converts PSD team to Sanity team doc with slugified name", () => {
    const psdTeam = {
      id: 1,
      name: "Eerste Elftallen A",
      age: "A",
      gender: "mannen",
      footbelId: 183904,
      active: true,
    };
    const playerIds = ["6453", "6458"];
    const staffIds = ["101", "102"];
    const result = transformTeam(psdTeam, playerIds, staffIds);
    expect(result.psdId).toBe("1");
    expect(result.slug).toBe("eerste-elftallen-a");
    expect(result.age).toBe("A");
    expect(result.footbelId).toBe(183904);
    expect(result.playerPsdIds).toEqual(["6453", "6458"]);
    expect(result.staffPsdIds).toEqual(["101", "102"]);
  });

  it("slugifies names with special characters", () => {
    const result = transformTeam(
      {
        id: 7,
        name: "KCVVÉ  U15 & Dames/Jeugd",
        age: "U15",
        gender: "mannen",
        footbelId: null,
        active: true,
      },
      [],
      [],
    );
    expect(result.slug).toBe("kcvve-u15-dames-jeugd");
  });
});

const makeMember = (overrides: Partial<PsdMember>): PsdMember => ({
  id: 1,
  firstName: "Jan",
  lastName: "Janssen",
  birthDate: null,
  nationality: null,
  profilePictureURL: null,
  keeper: false,
  bestPosition: null,
  active: true,
  status: "speler",
  functionTitle: null,
  ...overrides,
});

describe("partitionMembers", () => {
  it("puts status=speler members into players", () => {
    const { players, staff, unknown } = partitionMembers([
      makeMember({ id: 1, status: "speler" }),
    ]);
    expect(players).toHaveLength(1);
    expect(staff).toHaveLength(0);
    expect(unknown).toHaveLength(0);
  });

  it("puts status=staff members into staff", () => {
    const { players, staff, unknown } = partitionMembers([
      makeMember({ id: 2, status: "staff" }),
    ]);
    expect(players).toHaveLength(0);
    expect(staff).toHaveLength(1);
    expect(unknown).toHaveLength(0);
  });

  it("includes active=false players (PSD active means logged-in, not club membership)", () => {
    const { players } = partitionMembers([
      makeMember({ id: 3, status: "speler", active: false }),
    ]);
    expect(players).toHaveLength(1);
    expect(players[0]!.id).toBe(3);
  });

  it("puts unknown status into unknown, not players or staff", () => {
    const { players, staff, unknown } = partitionMembers([
      makeMember({ id: 4, status: "bestuurslid" }),
    ]);
    expect(players).toHaveLength(0);
    expect(staff).toHaveLength(0);
    expect(unknown).toHaveLength(1);
    expect(unknown[0]!.id).toBe(4);
  });

  it("partitions a mixed list correctly", () => {
    const members = [
      makeMember({ id: 1, status: "speler", active: true }),
      makeMember({ id: 2, status: "speler", active: false }),
      makeMember({ id: 3, status: "staff" }),
      makeMember({ id: 4, status: "weird_status" }),
    ];
    const { players, staff, unknown } = partitionMembers(members);
    expect(players.map((m) => m.id)).toEqual([1, 2]);
    expect(staff.map((m) => m.id)).toEqual([3]);
    expect(unknown.map((m) => m.id)).toEqual([4]);
  });
});
