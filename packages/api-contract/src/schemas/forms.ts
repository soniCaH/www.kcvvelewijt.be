import { Schema as S } from "effect";

/** The five membership roles a public applicant can pick. */
export const MembershipRole = S.Literal(
  "speler",
  "jeugdspeler",
  "vrijwilliger",
  "trainer",
  "scheidsrechter",
);
export type MembershipRole = S.Schema.Type<typeof MembershipRole>;

/** Roles that must acknowledge the medical-certificate requirement. */
export const MEDICAL_CERT_ROLES: ReadonlyArray<MembershipRole> = [
  "speler",
  "jeugdspeler",
];

export const MembershipGender = S.Literal("m", "f", "x");
export type MembershipGender = S.Schema.Type<typeof MembershipGender>;

/** Permissive single-line email check — full RFC validation is not worth it. */
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const Email = S.Trim.pipe(S.minLength(1), S.pattern(EMAIL_PATTERN));

/**
 * Public membership-intake payload. Shape/type rules live here (a decode
 * failure → automatic 400). Cross-field rules that depend on `birthDate`
 * (minor → parent fields, player → medical cert) are enforced server-side in
 * the BFF handler, which recomputes the minor flag on the submit date.
 */
export class MembershipRequest extends S.Class<MembershipRequest>(
  "MembershipRequest",
)({
  role: MembershipRole,
  firstName: S.Trim.pipe(S.minLength(1), S.maxLength(100)),
  lastName: S.Trim.pipe(S.minLength(1), S.maxLength(100)),
  /** Full date `YYYY-MM-DD` — needed to compute the minor flag. */
  birthDate: S.String.pipe(S.pattern(/^\d{4}-\d{2}-\d{2}$/)),
  gender: MembershipGender,
  /** City only — no street, no postal code. */
  municipality: S.Trim.pipe(S.minLength(1), S.maxLength(100)),
  email: Email,
  priorClub: S.optional(S.Trim.pipe(S.maxLength(200))),
  /** Parent/guardian email — required server-side only when the applicant is a minor. */
  parentEmail: S.optional(Email),
  parentalConsent: S.optional(S.Boolean),
  /** Medical-cert acknowledgment — required server-side only for player roles. */
  medicalCertAcknowledged: S.optional(S.Boolean),
  /** Privacy statement must be accepted — a literal `true` rejects anything else at decode. */
  privacyAccepted: S.Literal(true),
  /** Cloudflare Turnstile token, verified server-side. */
  turnstileToken: S.String,
  /** Honeypot — bots fill it, humans never see it. Non-empty → silently dropped. */
  company: S.optional(S.String),
}) {}

export class MembershipResponse extends S.Class<MembershipResponse>(
  "MembershipResponse",
)({
  ok: S.Boolean,
}) {}
