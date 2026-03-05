import {Schema as S} from 'effect'

/**
 * PSD MemberVO — shape returned by /teams/{id}/members (players) and /teams/{id}/staff.
 * Only fields actively used in the sync are declared.
 */
export class PsdMember extends S.Class<PsdMember>('PsdMember')({
  id: S.Number,
  firstName: S.NullOr(S.String),
  lastName: S.NullOr(S.String),
  birthDate: S.NullOr(S.String), // "YYYY-MM-DD HH:MM" — strip time on use
  nationality: S.NullOr(S.String), // full country name e.g. "Belgium"
  profilePictureURL: S.NullOr(S.String), // relative path — prepend PSD_API_BASE_URL
  keeper: S.Boolean, // always reliable; use to derive "Keeper" position
  bestPosition: S.NullOr(S.String), // null until KCVV populates PSD positions
  active: S.Boolean,
  status: S.String, // "speler" | "staff"
  functionTitle: S.NullOr(S.String), // staff only — free-text role e.g. "Keeperstrainer"
}) {}

export const PsdMembersPage = S.Struct({
  content: S.Array(PsdMember),
  totalElements: S.Number,
  totalPages: S.Number,
})
export type PsdMembersPage = S.Schema.Type<typeof PsdMembersPage>

/**
 * PSD TeamVO — shape returned by GET /teams (flat array, no pagination wrapper).
 */
export class PsdTeam extends S.Class<PsdTeam>('PsdTeam')({
  id: S.Number,
  name: S.String,
  age: S.String, // "A", "U17", "U15", etc.
  gender: S.String, // "mannen" | "mixed"
  footbelId: S.NullOr(S.Number), // null for youth teams without Footbel registration
  active: S.Boolean,
}) {}

export const PsdTeamsArray = S.Array(PsdTeam)
