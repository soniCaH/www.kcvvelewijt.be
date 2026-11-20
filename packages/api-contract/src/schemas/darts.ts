import { Schema as S } from "effect";
import { EmailAddress } from "./forms";

/** EK Darts takes 24 teams; the 25th signup goes on the wachtlijst (#3812). */
export const DARTS_TEAM_LIMIT = 24;

/**
 * Public EK Darts signup payload (#3812). No player names, no meal
 * pre-order: decided out. Spot vs wachtlijst is decided by the BFF at submit
 * time, never by the caller.
 */
export class DartsSignupRequest extends S.Class<DartsSignupRequest>(
  "DartsSignupRequest",
)({
  teamName: S.Trim.pipe(S.minLength(1), S.maxLength(100)),
  captainName: S.Trim.pipe(S.minLength(1), S.maxLength(100)),
  captainEmail: EmailAddress,
  captainPhone: S.Trim.pipe(S.minLength(1), S.maxLength(30)),
  /** Free remark — longer than 1000 is a 400, never a silent cut. */
  remark: S.optional(S.Trim.pipe(S.maxLength(1000))),
  /** "Ik ken het reglement" — a literal `true` rejects anything else at decode. */
  rulesAccepted: S.Literal(true),
  /** "Inschrijving is pas definitief na betaling" — same literal rule. */
  paymentAccepted: S.Literal(true),
  /** Cloudflare Turnstile token, verified server-side. */
  turnstileToken: S.String,
  /** Honeypot — bots fill it, humans never see it. Non-empty → silently dropped. */
  company: S.optional(S.String),
}) {}

export class DartsSignupResponse extends S.Class<DartsSignupResponse>(
  "DartsSignupResponse",
)({
  ok: S.Boolean,
  /** True when the team landed on the wachtlijst (spot 25 and later). */
  waitlist: S.Boolean,
}) {}

/** Live from Sanity at request time, never stored. */
export class DartsSpotsResponse extends S.Class<DartsSpotsResponse>(
  "DartsSpotsResponse",
)({
  spotsLeft: S.Finite.pipe(S.int(), S.greaterThanOrEqualTo(0)),
}) {}
