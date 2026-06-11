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

  it("uses the first member of a position contact and deep-links the hub structuur", () => {
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
    expect(resolved.nodeId).toBe("node-vz");
    // Rewired off the retired /club/organigram route to the hub deep-link.
    expect(resolved.organigramHref).toBe("/hulp?member=node-vz#structuur");
  });

  it("encodes the nodeId in the deep-link", () => {
    const resolved = resolveContact({
      contactType: "position",
      position: "Trainer A",
      nodeId: "node/A 1",
      members: [{ id: "m1", name: "Coach" }],
    });
    expect(resolved.organigramHref).toBe("/hulp?member=node%2FA%201#structuur");
  });

  it("omits the cross-link when a position contact has no node or members", () => {
    const resolved = resolveContact({
      contactType: "position",
      position: "Voorzitter",
      members: [],
    });
    expect(resolved.name).toBe("Voorzitter");
    expect(resolved.email).toBeUndefined();
    expect(resolved.nodeId).toBeUndefined();
    expect(resolved.organigramHref).toBeUndefined();
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
    expect(trainer.nodeId).toBeUndefined();

    const afgevaardigde = resolveContact({
      contactType: "team-role",
      teamRole: "afgevaardigde",
    });
    expect(afgevaardigde.role).toBe("Afgevaardigde van jouw ploeg");
  });
});
