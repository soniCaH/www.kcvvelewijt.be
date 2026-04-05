import { describe, it, expect } from "vitest";
import {
  resolveTeamRoleContact,
  hasTeamRoleContact,
  mapAgeToJcGroup,
} from "./team-role-resolution";
import type { TeamStaffMember } from "./team-role-resolution";
import type { ResponsibilityPath, Contact } from "@/types/responsibility";

// ─── Fixtures ───────────────────────────────────────────────────────────────

const trainerStaff: TeamStaffMember = {
  id: "staff-1",
  firstName: "Jan",
  lastName: "Janssens",
  role: "trainer",
  email: "jan@kcvv.be",
  phone: "+32 123 456 789",
};

const afgevaardigdeStaff: TeamStaffMember = {
  id: "staff-2",
  firstName: "Piet",
  lastName: "Pieters",
  role: "afgevaardigde",
  email: "piet@kcvv.be",
};

const noRoleStaff: TeamStaffMember = {
  id: "staff-3",
  firstName: "Klaas",
  lastName: "Kansen",
  role: "",
};

// ─── resolveTeamRoleContact ─────────────────────────────────────────────────

describe("resolveTeamRoleContact", () => {
  it("resolves trainer from team staff", () => {
    const result = resolveTeamRoleContact(
      [trainerStaff, afgevaardigdeStaff],
      "trainer",
    );

    expect(result).toEqual<Contact>({
      contactType: "position",
      position: "Trainer",
      members: [
        {
          id: "staff-1",
          name: "Jan Janssens",
          email: "jan@kcvv.be",
          phone: "+32 123 456 789",
        },
      ],
    });
  });

  it("resolves afgevaardigde from team staff", () => {
    const result = resolveTeamRoleContact(
      [trainerStaff, afgevaardigdeStaff],
      "afgevaardigde",
    );

    expect(result).toEqual<Contact>({
      contactType: "position",
      position: "Afgevaardigde",
      members: [
        {
          id: "staff-2",
          name: "Piet Pieters",
          email: "piet@kcvv.be",
        },
      ],
    });
  });

  it("returns null when no matching role in staff", () => {
    const result = resolveTeamRoleContact([noRoleStaff], "trainer");
    expect(result).toBeNull();
  });

  it("returns null for empty staff array", () => {
    const result = resolveTeamRoleContact([], "trainer");
    expect(result).toBeNull();
  });

  it("omits email and phone when not present", () => {
    const staffNoContact: TeamStaffMember = {
      id: "staff-4",
      firstName: "Kim",
      lastName: "De Smet",
      role: "trainer",
    };

    const result = resolveTeamRoleContact([staffNoContact], "trainer");

    expect(result).toEqual<Contact>({
      contactType: "position",
      position: "Trainer",
      members: [{ id: "staff-4", name: "Kim De Smet" }],
    });
  });
});

// ─── mapAgeToJcGroup ────────────────────────────────────────────────────────

describe("mapAgeToJcGroup", () => {
  it.each([
    ["U6", "onderbouw"],
    ["U7", "onderbouw"],
    ["U8", "onderbouw"],
    ["U9", "onderbouw"],
    ["U10", "middenbouw"],
    ["U11", "middenbouw"],
    ["U12", "middenbouw"],
    ["U13", "middenbouw"],
    ["U14", "bovenbouw"],
    ["U15", "bovenbouw"],
    ["U17", "bovenbouw"],
    ["U21", "bovenbouw"],
  ] as const)("maps %s to %s", (age, expected) => {
    expect(mapAgeToJcGroup(age)).toBe(expected);
  });

  it("handles lowercase age codes", () => {
    expect(mapAgeToJcGroup("u13")).toBe("middenbouw");
  });

  it("handles age with letter suffix (U13A)", () => {
    expect(mapAgeToJcGroup("U13A")).toBe("middenbouw");
  });

  it("returns null for non-youth ages", () => {
    expect(mapAgeToJcGroup("A")).toBeNull();
    expect(mapAgeToJcGroup("")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(mapAgeToJcGroup(null)).toBeNull();
  });
});

// ─── hasTeamRoleContact ─────────────────────────────────────────────────────

describe("hasTeamRoleContact", () => {
  const positionContact: Contact = {
    contactType: "position",
    position: "TVJO",
    members: [],
  };

  const teamRoleContact: Contact = {
    contactType: "team-role",
    teamRole: "trainer",
  };

  it("returns true when primaryContact is team-role", () => {
    const path = {
      primaryContact: teamRoleContact,
      steps: [],
    } as unknown as ResponsibilityPath;

    expect(hasTeamRoleContact(path)).toBe(true);
  });

  it("returns true when a step contact is team-role", () => {
    const path = {
      primaryContact: positionContact,
      steps: [{ description: "Step 1", contact: teamRoleContact }],
    } as unknown as ResponsibilityPath;

    expect(hasTeamRoleContact(path)).toBe(true);
  });

  it("returns false when no team-role contacts exist", () => {
    const path = {
      primaryContact: positionContact,
      steps: [{ description: "Step 1", contact: positionContact }],
    } as unknown as ResponsibilityPath;

    expect(hasTeamRoleContact(path)).toBe(false);
  });

  it("returns false when steps have no contacts", () => {
    const path = {
      primaryContact: positionContact,
      steps: [{ description: "Step 1" }],
    } as unknown as ResponsibilityPath;

    expect(hasTeamRoleContact(path)).toBe(false);
  });
});
