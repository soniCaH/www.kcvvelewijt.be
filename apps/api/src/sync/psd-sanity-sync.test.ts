import { describe, it, expect, vi } from "vitest";
import { Effect } from "effect";
import {
  transformMember,
  transformTeam,
  transformStaff,
  partitionMembers,
  reconcileEntity,
  MAX_ORPHAN_RATIO,
} from "./psd-sanity-sync";
import type { PsdMember } from "../psd/schemas-player-team";

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
        "/api/v2/members/profilepicture/6453?profileAccessKey=abc123&v=1",
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
    // profileAccessKey stripped (ephemeral), v= retained (photo version for dedup)
    expect(result._psdImageUrl).toBe(
      `${BASE_URL}/api/v2/members/profilepicture/6453?v=1`,
    );
  });

  it("strips profileAccessKey but retains v= from image URL", () => {
    const result = transformMember(
      {
        id: 6453,
        firstName: "Alexander",
        lastName: "Bell",
        birthDate: null,
        nationality: null,
        profilePictureURL:
          "/api/v2/members/profilepicture/6453?profileAccessKey=newkey999&v=0",
        keeper: false,
        bestPosition: null,
        active: true,
        status: "speler",
        functionTitle: null,
      },
      BASE_URL,
    );
    expect(result._psdImageUrl).toBe(
      `${BASE_URL}/api/v2/members/profilepicture/6453?v=0`,
    );
  });

  it("omits v= when not present in profilePictureURL", () => {
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
    expect(result.roleCode).toBe("T1");
  });

  it("handles null functionTitle", () => {
    const result = transformStaff({ ...baseStaff, functionTitle: null });
    expect(result.roleCode).toBeUndefined();
  });

  it("accepts functionTitle of exactly 6 characters", () => {
    const result = transformStaff({ ...baseStaff, functionTitle: "T12345" });
    expect(result.roleCode).toBe("T12345");
  });

  it("sets roleCode to undefined when functionTitle exceeds 6 characters", () => {
    const result = transformStaff({
      ...baseStaff,
      functionTitle: "Jeugdcoördinator",
    });
    expect(result.roleCode).toBeUndefined();
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

// ─── reconcileEntity ─────────────────────────────────────────────────────────

describe("reconcileEntity", () => {
  it("archives orphans when ratio is below threshold", async () => {
    // 10 active in Sanity, 8 accumulated from PSD → 2 orphans (20% < 30%)
    const activeIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const accumulatedIds = new Set(["1", "2", "3", "4", "5", "6", "7", "8"]);
    const archiveFn = vi.fn(() => Effect.void);

    const result = await Effect.runPromise(
      reconcileEntity("players", activeIds, accumulatedIds, archiveFn),
    );

    expect(result).toEqual({ action: "archived", orphanIds: ["9", "10"] });
    expect(archiveFn).toHaveBeenCalledWith(["9", "10"]);
  });

  it("skips archival when orphan ratio exceeds threshold", async () => {
    // 10 active in Sanity, 3 accumulated → 7 orphans (70% > 30%)
    const activeIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const accumulatedIds = new Set(["1", "2", "3"]);
    const archiveFn = vi.fn(() => Effect.void);

    const result = await Effect.runPromise(
      reconcileEntity("teams", activeIds, accumulatedIds, archiveFn),
    );

    expect(result).toEqual({
      action: "skipped",
      orphanCount: 7,
      activeCount: 10,
      ratio: 0.7,
    });
    expect(archiveFn).not.toHaveBeenCalled();
  });

  it("handles 0 active entities without division by zero", async () => {
    const activeIds: string[] = [];
    const accumulatedIds = new Set(["1", "2"]);
    const archiveFn = vi.fn(() => Effect.void);

    const result = await Effect.runPromise(
      reconcileEntity("staff", activeIds, accumulatedIds, archiveFn),
    );

    expect(result).toEqual({ action: "none" });
    expect(archiveFn).not.toHaveBeenCalled();
  });

  it("triggers threshold when accumulated set is empty but active entities exist", async () => {
    // 5 active, 0 accumulated → 5 orphans (100% > 30%)
    const activeIds = ["1", "2", "3", "4", "5"];
    const accumulatedIds = new Set<string>();
    const archiveFn = vi.fn(() => Effect.void);

    const result = await Effect.runPromise(
      reconcileEntity("players", activeIds, accumulatedIds, archiveFn),
    );

    expect(result).toEqual({
      action: "skipped",
      orphanCount: 5,
      activeCount: 5,
      ratio: 1,
    });
    expect(archiveFn).not.toHaveBeenCalled();
  });

  it("archives when orphan ratio is exactly at threshold (30%)", async () => {
    // 10 active, 7 accumulated → 3 orphans (exactly 30%, not greater than)
    const activeIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const accumulatedIds = new Set(["1", "2", "3", "4", "5", "6", "7"]);
    const archiveFn = vi.fn(() => Effect.void);

    const result = await Effect.runPromise(
      reconcileEntity("players", activeIds, accumulatedIds, archiveFn),
    );

    // ratio == 0.3 is NOT greater than 0.3, so archival proceeds
    expect(result).toEqual({
      action: "archived",
      orphanIds: ["8", "9", "10"],
    });
    expect(archiveFn).toHaveBeenCalledWith(["8", "9", "10"]);
  });

  it("has MAX_ORPHAN_RATIO set to 0.3", () => {
    expect(MAX_ORPHAN_RATIO).toBe(0.3);
  });
});
