import { describe, it, expect } from "vitest";
import { resolveContact } from "./resolveContact";

describe("resolveContact", () => {
  it("collapses a manual contact to its inline fields", () => {
    expect(
      resolveContact({
        contactType: "manual",
        role: "Secretariaat",
        email: "secretariaat@kcvvelewijt.be",
        phone: "+32 471 23 45 67",
      }),
    ).toEqual({
      name: "Secretariaat",
      role: "Secretariaat",
      email: "secretariaat@kcvvelewijt.be",
      phone: "+32 471 23 45 67",
    });
  });

  it("uses the first member of a position contact", () => {
    const resolved = resolveContact({
      contactType: "position",
      position: "Voorzitter",
      nodeId: "node-vz",
      members: [
        { id: "m1", name: "Jan Willems", email: "vz@kcvvelewijt.be" },
        { id: "m2", name: "Backup Person" },
      ],
    });
    expect(resolved.name).toBe("Jan Willems");
    expect(resolved.role).toBe("Voorzitter");
    expect(resolved.email).toBe("vz@kcvvelewijt.be");
    expect(resolved.memberId).toBe("m1");
    expect(resolved.organigramHref).toBe("/club/organigram?node=node-vz");
  });

  it("falls back to the position label when a position contact has no members", () => {
    const resolved = resolveContact({
      contactType: "position",
      position: "Voorzitter",
      members: [],
    });
    expect(resolved.name).toBe("Voorzitter");
    expect(resolved.email).toBeUndefined();
    expect(resolved.organigramHref).toBe("/club/organigram");
  });

  it("renders a team-role contact with a generic role label and a /ploegen link", () => {
    const trainer = resolveContact({
      contactType: "team-role",
      teamRole: "trainer",
    });
    expect(trainer.role).toBe("Trainer van jouw ploeg");
    expect(trainer.organigramHref).toBe("/ploegen");
    expect(trainer.email).toBeUndefined();
    expect(trainer.phone).toBeUndefined();

    const afgevaardigde = resolveContact({
      contactType: "team-role",
      teamRole: "afgevaardigde",
    });
    expect(afgevaardigde.role).toBe("Afgevaardigde van jouw ploeg");
  });
});
