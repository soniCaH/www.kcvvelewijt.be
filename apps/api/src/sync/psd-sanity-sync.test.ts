import { describe, it, expect } from "vitest";
import { transformMember, transformTeam } from "./psd-sanity-sync";

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
    expect(result._psdImageUrl).toBe(
      `${BASE_URL}/api/v2/members/profilepicture/6453?profileAccessKey=abc123`,
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
    const result = transformTeam(psdTeam, playerIds);
    expect(result.psdId).toBe("1");
    expect(result.slug).toBe("eerste-elftallen-a");
    expect(result.age).toBe("A");
    expect(result.footbelId).toBe(183904);
    expect(result.playerPsdIds).toEqual(["6453", "6458"]);
  });

  it("slugifies names with special characters", () => {
    const result = transformTeam(
      {
        id: 7,
        name: "KCVVE  U15 ",
        age: "U15",
        gender: "mannen",
        footbelId: null,
        active: true,
      },
      [],
    );
    expect(result.slug).toBe("kcvve-u15");
  });
});
