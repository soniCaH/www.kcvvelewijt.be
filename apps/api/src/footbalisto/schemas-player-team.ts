/**
 * PSD API — Player & Team response shapes (investigated 2026-03-05)
 *
 * ─── ENDPOINTS ──────────────────────────────────────────────────────────────
 *
 * GET /teams
 *   Returns: MemberVO[] (flat array, no pagination wrapper)
 *   Fields used: id, name, age, gender, footbelId, active
 *
 * GET /teams/{id}/members   ← players (NOT /teams/{id}/players — 404)
 *   Returns: Page<MemberVO>  { content: MemberVO[], totalElements, totalPages, size, number }
 *   Filter: player === true, staff === false
 *
 * GET /teams/{id}/staff
 *   Returns: Page<MemberVO>  (same shape as /members)
 *   Filter: staff === true, player === false
 *
 * ─── MemberVO shape (fields relevant to sync) ───────────────────────────────
 *
 * {
 *   id: number                  // PSD member ID — use as psdId
 *   firstName: string
 *   lastName: string
 *   birthDate: string | null    // "YYYY-MM-DD HH:MM" — strip time component
 *   nationality: string | null  // full country name e.g. "Belgium", often null
 *   profilePictureURL: string   // relative: "/api/v2/members/profilepicture/{id}?profileAccessKey=..."
 *                               // prepend PSD_API_BASE_URL to get absolute URL
 *   keeper: boolean             // true → position is Keeper
 *   active: boolean
 *   status: "speler" | "staff"
 *   // Staff only:
 *   functionTitle: string | null  // free-text role e.g. "Keeperstrainer", "T2", "Hoofdtrainer"
 *   sportiveRole: string | null   // same value as functionTitle in practice
 * }
 *
 * ─── FIELDS NOT AVAILABLE FROM PSD (KCVV-specific) ─────────────────────────
 *
 * shirtNumber   → always null in list and detail endpoints for KCVV
 * bestPosition  → currently null (KCVV hasn't populated PSD positions yet), but IS synced
 *                 when populated. keeper: boolean is always reliable for keepers.
 * positions     → always [] / null in practice
 * height        → not in MemberVO
 * weight        → not in MemberVO
 * joinDate      → not in MemberVO (creationDate is admin record date, not join date)
 * leaveDate     → not in MemberVO
 *
 * ─── TeamVO shape (from /teams — flat array) ────────────────────────────────
 *
 * {
 *   id: number
 *   name: string               // e.g. "Eerste Elftallen A", "KCVVE U17"
 *   age: string                // e.g. "A", "U17", "U15"
 *   gender: "mannen" | "mixed"
 *   footbelId: number | null   // null for youth teams without official Footbel registration
 *   active: boolean
 * }
 *
 * Note: /teams returns a flat array (no pagination wrapper).
 * Note: team name/age/gender is the only identity data — no league/division from this endpoint.
 *       League and division are known from the existing match + ranking endpoints.
 */

import { Schema as S } from "effect";

// ─── Team ────────────────────────────────────────────────────────────────────

export class PsdTeam extends S.Class<PsdTeam>("PsdTeam")({
  id: S.Number,
  name: S.String,
  age: S.String,
  gender: S.String,
  footbelId: S.NullOr(S.Number),
  active: S.Boolean,
}) {}

export const PsdTeamsSchema = S.Array(PsdTeam);

// ─── Member (player or staff) ────────────────────────────────────────────────

export class PsdMember extends S.Class<PsdMember>("PsdMember")({
  id: S.Number,
  firstName: S.String,
  lastName: S.String,
  birthDate: S.NullOr(S.String),
  nationality: S.NullOr(S.String),
  profilePictureURL: S.NullOr(S.String),
  keeper: S.Boolean,
  bestPosition: S.NullOr(S.String),
  active: S.Boolean,
  status: S.String,
  functionTitle: S.NullOr(S.String),
}) {}

export const PsdMembersPageSchema = S.Struct({
  content: S.Array(PsdMember),
  totalElements: S.Number,
  totalPages: S.Number,
});
