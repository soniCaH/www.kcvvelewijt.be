import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type {
  TEAMS_QUERY_RESULT,
  TEAM_BY_SLUG_QUERY_RESULT,
  TEAMS_LANDING_QUERY_RESULT,
} from "../sanity/sanity.types";
import { toPlayerVM, type PlayerVM } from "./player.repository";
import type { TeamLandingItem } from "../utils/group-teams";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const TEAMS_QUERY =
  defineQuery(`*[_type == "team" && archived != true && showInNavigation != false] | order(name asc) {
  _id, psdId, name, "slug": slug.current, age, gender, footbelId, leagueId, division, divisionFull,
  tagline,
  "teamImageUrl": teamImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
}`);

export const TEAM_BY_SLUG_QUERY =
  defineQuery(`*[_type == "team" && slug.current == $slug][0] {
  _id, psdId, name, "slug": slug.current, age, gender, footbelId, leagueId, division, divisionFull,
  tagline, body[]{ ..., "fileUrl": file.asset->url }, contactInfo,
  "teamImageUrl": teamImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  trainingSchedule,
  players[]-> {
    _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
    "psdImageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
    "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max"
  },
  staff[]-> { _id, firstName, lastName, role, "photoUrl": photo.asset->url + "?w=200&q=80&fm=webp&fit=max" }
}`);

export const TEAMS_LANDING_QUERY =
  defineQuery(`*[_type == "team" && archived != true && showInNavigation != false && defined(age)] | order(name asc) {
  _id, name, "slug": slug.current, age,
  division, divisionFull, tagline,
  "teamImageUrl": teamImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  staff[]-> { firstName, lastName, role }
}`);

// ─── View Models ─────────────────────────────────────────────────────────────

export interface TeamNavVM {
  id: string;
  name: string;
  slug: string;
  age: string | null;
  psdId: string | null;
  division: string | null;
  divisionFull: string | null;
  tagline: string | null;
  teamImageUrl: string | null;
}

export interface StaffMemberVM {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  imageUrl?: string;
}

export interface TeamDetailVM {
  id: string;
  name: string;
  slug: string;
  age: string | null;
  psdId: string | null;
  footbelId: number | null;
  leagueId: number | null;
  division: string | null;
  divisionFull: string | null;
  tagline: string | undefined;
  teamType: "youth" | "senior";
  ageGroup: string | undefined;
  teamImageUrl: string | null;
  body: TEAM_BY_SLUG_DETAIL["body"];
  contactInfo: TEAM_BY_SLUG_DETAIL["contactInfo"];
  trainingSchedule: TEAM_BY_SLUG_DETAIL["trainingSchedule"];
  players: PlayerVM[];
  staff: StaffMemberVM[];
}

// Non-null variant of the generated query result
type TEAM_BY_SLUG_DETAIL = Exclude<TEAM_BY_SLUG_QUERY_RESULT, null>;

// ─── Transforms ──────────────────────────────────────────────────────────────

export function toTeamNavVM(row: TEAMS_QUERY_RESULT[number]): TeamNavVM {
  return {
    id: row._id,
    name: row.name ?? "",
    slug: row.slug ?? "",
    age: row.age,
    psdId: row.psdId,
    division: row.division,
    divisionFull: row.divisionFull,
    tagline: row.tagline,
    teamImageUrl: row.teamImageUrl,
  };
}

function computeTagline(row: TEAM_BY_SLUG_DETAIL): string | undefined {
  return row.tagline ?? row.divisionFull ?? row.division ?? undefined;
}

function computeTeamType(age: string | null): "youth" | "senior" {
  const lower = (age ?? "").toLowerCase();
  return lower.startsWith("u") || lower.includes("jeugd") ? "youth" : "senior";
}

function computeAgeGroup(age: string | null): string | undefined {
  if (!age) return undefined;
  const match = age.match(/U\d{1,2}[A-Z]?/i);
  return match ? match[0].toUpperCase() : undefined;
}

function toStaffMemberVM(
  row: NonNullable<TEAM_BY_SLUG_DETAIL["staff"]>[number],
): StaffMemberVM {
  return {
    id: row._id,
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    role: row.role ?? "",
    imageUrl: row.photoUrl ?? undefined,
  };
}

function toTeamDetailVM(row: TEAM_BY_SLUG_DETAIL): TeamDetailVM {
  return {
    id: row._id,
    name: row.name ?? "",
    slug: row.slug ?? "",
    age: row.age,
    psdId: row.psdId,
    footbelId: row.footbelId,
    leagueId: row.leagueId,
    division: row.division,
    divisionFull: row.divisionFull,
    tagline: computeTagline(row),
    teamType: computeTeamType(row.age),
    ageGroup: computeAgeGroup(row.age),
    teamImageUrl: row.teamImageUrl,
    body: row.body,
    contactInfo: row.contactInfo,
    trainingSchedule: row.trainingSchedule,
    players: (row.players ?? []).map(toPlayerVM),
    staff: (row.staff ?? []).map(toStaffMemberVM),
  };
}

function toTeamLandingItem(
  row: TEAMS_LANDING_QUERY_RESULT[number],
): TeamLandingItem {
  return {
    _id: row._id,
    name: row.name ?? "",
    slug: row.slug ?? "",
    age: row.age ?? "",
    division: row.division,
    divisionFull: row.divisionFull,
    tagline: row.tagline,
    teamImageUrl: row.teamImageUrl,
    staff:
      row.staff?.map((s) => ({
        firstName: s.firstName ?? "",
        lastName: s.lastName ?? "",
        role: s.role ?? "",
      })) ?? null,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface TeamRepositoryInterface {
  readonly findAll: () => Effect.Effect<TeamNavVM[]>;
  readonly findBySlug: (slug: string) => Effect.Effect<TeamDetailVM | null>;
  readonly findAllForLanding: () => Effect.Effect<TeamLandingItem[]>;
}

export class TeamRepository extends Context.Tag("TeamRepository")<
  TeamRepository,
  TeamRepositoryInterface
>() {}

export const TeamRepositoryLive = Layer.succeed(TeamRepository, {
  findAll: () =>
    fetchGroq<TEAMS_QUERY_RESULT>(TEAMS_QUERY).pipe(
      Effect.map((rows) => rows.map(toTeamNavVM)),
    ),
  findBySlug: (slug) =>
    fetchGroq<TEAM_BY_SLUG_QUERY_RESULT>(TEAM_BY_SLUG_QUERY, { slug }).pipe(
      Effect.map((row) => (row ? toTeamDetailVM(row) : null)),
    ),
  findAllForLanding: () =>
    fetchGroq<TEAMS_LANDING_QUERY_RESULT>(TEAMS_LANDING_QUERY).pipe(
      Effect.map((rows) => rows.map(toTeamLandingItem)),
    ),
});
