import { describe, it, expect } from "vitest";
import type { MembershipRequest } from "@kcvv/api-contract";
import { validateMembershipRules } from "./membership-rules";

const base: MembershipRequest = {
  role: "vrijwilliger",
  firstName: "Jan",
  lastName: "Peeters",
  birthDate: "1990-06-15",
  gender: "m",
  municipality: "Elewijt",
  email: "jan@example.com",
  privacyAccepted: true,
  turnstileToken: "tok",
} as MembershipRequest;

const SUBMIT = new Date("2026-06-21T10:00:00Z");

describe("validateMembershipRules", () => {
  it("passes a clean adult volunteer", () => {
    expect(validateMembershipRules(base, SUBMIT)).toEqual({});
  });

  it("requires parent email + consent for a minor", () => {
    const errors = validateMembershipRules(
      { ...base, birthDate: "2012-01-01" },
      SUBMIT,
    );
    expect(errors.parentEmail).toBeDefined();
    expect(errors.parentalConsent).toBeDefined();
  });

  it("accepts a minor with parent email + consent", () => {
    const errors = validateMembershipRules(
      {
        ...base,
        birthDate: "2012-01-01",
        parentEmail: "ouder@example.com",
        parentalConsent: true,
      },
      SUBMIT,
    );
    expect(errors).toEqual({});
  });

  it("rejects an implausible birth year without asking for parent fields", () => {
    expect(
      validateMembershipRules({ ...base, birthDate: "0010-05-01" }, SUBMIT),
    ).toEqual({ birthDate: "Vul een geldige geboortedatum in." });
  });

  it("still checks the medical cert next to an implausible birth date", () => {
    const errors = validateMembershipRules(
      { ...base, role: "speler", birthDate: "0010-05-01" },
      SUBMIT,
    );
    expect(errors.birthDate).toBeDefined();
    expect(errors.medicalCertAcknowledged).toBeDefined();
    expect(errors.parentEmail).toBeUndefined();
  });

  it("wants the parent fields until the 18th birthday has begun in UTC", () => {
    // 2026-10-15T00:30 Brussels = 2026-10-14T22:30Z; the web form pins the same instant.
    const errors = validateMembershipRules(
      { ...base, birthDate: "2008-10-15" },
      new Date("2026-10-14T22:30:00Z"),
    );
    expect(Object.keys(errors).sort()).toEqual([
      "parentEmail",
      "parentalConsent",
    ]);
  });

  it("requires medical-cert acknowledgment for speler", () => {
    const errors = validateMembershipRules({ ...base, role: "speler" }, SUBMIT);
    expect(errors.medicalCertAcknowledged).toBeDefined();
  });

  it("requires medical-cert acknowledgment for jeugdspeler (and combines with minor rules)", () => {
    const errors = validateMembershipRules(
      { ...base, role: "jeugdspeler", birthDate: "2014-01-01" },
      SUBMIT,
    );
    expect(errors.medicalCertAcknowledged).toBeDefined();
    expect(errors.parentEmail).toBeDefined();
  });

  it("does not require medical cert for non-player roles", () => {
    const errors = validateMembershipRules(
      { ...base, role: "scheidsrechter" },
      SUBMIT,
    );
    expect(errors.medicalCertAcknowledged).toBeUndefined();
  });
});
