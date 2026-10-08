import { describe, it, expect } from "vitest";
import { Schema as S, Either } from "effect";
import { MembershipRequest } from "./forms";

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
