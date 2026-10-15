import { describe, it, expect } from "vitest";
import { Schema as S, Either } from "effect";
import {
  ageOn,
  isMinorOn,
  isPlausibleBirthDate,
  MembershipRequest,
} from "./forms";

const valid = {
  role: "vrijwilliger",
  firstName: "Jan",
  lastName: "Peeters",
  birthDate: "1990-06-15",
  gender: "m",
  municipality: "Elewijt",
  email: "jan@example.com",
  privacyAccepted: true,
  turnstileToken: "tok",
};

const decode = S.decodeUnknownEither(MembershipRequest);

describe("MembershipRequest.remark", () => {
  it("is optional", () => {
    const result = decode(valid);
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right.remark).toBeUndefined();
  });

  it("is trimmed", () => {
    const result = decode({ ...valid, remark: "  Mijn zoon is keeper.  " });
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result))
      expect(result.right.remark).toBe("Mijn zoon is keeper.");
  });

  it("accepts exactly 1000 characters", () => {
    expect(Either.isRight(decode({ ...valid, remark: "a".repeat(1000) }))).toBe(
      true,
    );
  });

  it("rejects more than 1000 characters instead of cutting them", () => {
    expect(Either.isLeft(decode({ ...valid, remark: "a".repeat(1001) }))).toBe(
      true,
    );
  });
});

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

describe("isPlausibleBirthDate", () => {
  const now = new Date("2026-10-15T12:00:00Z");

  it.each([
    ["an impossible day", "2024-02-31"],
    ["a non-leap Feb 29", "2023-02-29"],
    ["an impossible month", "2026-13-99"],
    ["a mistyped year 0010", "0010-05-01"],
    ["year 0001", "0001-01-01"],
    ["year 9999", "9999-01-01"],
    ["tomorrow", "2026-10-16"],
    ["101 years ago", "1925-10-15"],
    ["a malformed string", "2010-5-1"],
  ])("rejects %s", (_label, value) => {
    expect(isPlausibleBirthDate(value, now)).toBe(false);
  });

  it.each([
    ["a leap day", "2024-02-29"],
    ["today", "2026-10-15"],
    ["exactly 100 years ago", "1926-10-15"],
    ["an ordinary date", "2010-05-01"],
  ])("accepts %s", (_label, value) => {
    expect(isPlausibleBirthDate(value, now)).toBe(true);
  });
});
