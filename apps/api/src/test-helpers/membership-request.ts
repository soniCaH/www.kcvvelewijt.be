import { Schema as S } from "effect";
import { MembershipRequest } from "@kcvv/api-contract";

/** Raw wire JSON for a valid adult volunteer application. */
export const validMembershipRaw = {
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

/** Decode raw JSON through the contract, so a schema change breaks the tests. */
export const decodeMembership = (raw: unknown): MembershipRequest =>
  S.decodeUnknownSync(MembershipRequest)(raw);
