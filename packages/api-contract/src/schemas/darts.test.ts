import { describe, it, expect } from "vitest";
import { Schema as S, Either } from "effect";
import { DartsSignupRequest } from "./darts";

const valid = {
  teamName: "De Pijlenjagers",
  captainName: "Jan Peeters",
  captainEmail: "jan@example.com",
  captainPhone: "0470 12 34 56",
  rulesAccepted: true,
  paymentAccepted: true,
  turnstileToken: "tok",
};

const decode = S.decodeUnknownEither(DartsSignupRequest);

describe("DartsSignupRequest", () => {
  it("accepts a complete signup without a remark", () => {
    expect(Either.isRight(decode(valid))).toBe(true);
  });

  it.each(["teamName", "captainName", "captainEmail", "captainPhone"])(
    "rejects a blank %s",
    (field) => {
      expect(Either.isLeft(decode({ ...valid, [field]: "   " }))).toBe(true);
    },
  );

  it.each(["rulesAccepted", "paymentAccepted"])(
    "rejects an unticked %s",
    (field) => {
      expect(Either.isLeft(decode({ ...valid, [field]: false }))).toBe(true);
    },
  );

  it("rejects a malformed captain e-mail", () => {
    expect(
      Either.isLeft(decode({ ...valid, captainEmail: "jan@" })),
    ).toBe(true);
  });

  it("rejects a remark over 1000 characters instead of cutting it", () => {
    expect(
      Either.isLeft(decode({ ...valid, remark: "x".repeat(1001) })),
    ).toBe(true);
  });
});
