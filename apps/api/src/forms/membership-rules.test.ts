import { describe, it, expect } from "vitest";
import type { MembershipRequest } from "@kcvv/api-contract";
import { ageOn, isMinorOn, validateMembershipRules } from "./membership-rules";

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

describe("ageOn", () => {
  it("counts a birthday that already passed this year", () => {
    expect(ageOn("1990-06-15", SUBMIT)).toBe(36);
  });
  it("does not count a birthday later this year", () => {
    expect(ageOn("1990-12-15", SUBMIT)).toBe(35);
  });
  it("treats the birthday itself as the new age", () => {
    expect(ageOn("2008-06-21", SUBMIT)).toBe(18);
  });
});

describe("isMinorOn", () => {
  it("is true the day before the 18th birthday", () => {
    expect(isMinorOn("2008-06-22", SUBMIT)).toBe(true);
  });
  it("is false on the 18th birthday", () => {
    expect(isMinorOn("2008-06-21", SUBMIT)).toBe(false);
  });
});

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
