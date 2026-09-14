import { describe, it, expect } from "vitest";
import { resolveContact } from "./resolveContact";
import type { Contact } from "@/types/responsibility";

// Type-level regression tests (#2958) — TypeScript, not vitest, is under
// test here. `@ts-expect-error` fails the type check if `Contact` ever
// regresses to its pre-#2958 flat interface, where every field (including
// `teamRole`) was optional and legal to read/write on every arm regardless
// of `contactType` — the exact shape that let the dead `teamRoleFallback`
// field (#2952) sit untyped-differently from a live field for months.

// `teamRole` is required on the "team-role" arm.
// @ts-expect-error — omitting `teamRole` on a "team-role" contact must not compile.
const _teamRoleContactRequiresTeamRole: Contact = { contactType: "team-role" };

// `teamRole` only exists on the "team-role" arm.
const _manualContact: Contact = {
  contactType: "manual",
  role: "Secretariaat",
  // @ts-expect-error — `teamRole` does not exist on the "manual" arm.
  teamRole: "trainer",
};

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

  it("renders the generic team-role fallback label with no /ploegen link (the 'manual' arm has no organigramHref concept)", () => {
    // The exact shape `responsibility.repository.ts`'s `toContact()`
    // degrades a team-role row with a missing/invalid `teamRole` to. The
    // generic label survives; the pre-#2958 `/ploegen` link does not.
    const resolved = resolveContact({
      contactType: "manual",
      role: "Contactpersoon van jouw ploeg",
    });
    expect(resolved.name).toBe("Contactpersoon van jouw ploeg");
    expect(resolved.role).toBe("Contactpersoon van jouw ploeg");
    expect(resolved.organigramHref).toBeUndefined();
  });
});
