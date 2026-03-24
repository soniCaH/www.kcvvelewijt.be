import { Context, Effect, Layer } from "effect";
import { sanityClient } from "../sanity/client";
import { TEAMS_QUERY, TEAM_BY_SLUG_QUERY } from "../sanity/queries/teams";
import type {
  TEAMS_QUERY_RESULT,
  TEAM_BY_SLUG_QUERY_RESULT,
} from "../sanity/sanity.types";
import { toPlayerVM, type PlayerVM } from "./player.repository";

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

// ─── Service ─────────────────────────────────────────────────────────────────

export interface TeamRepositoryInterface {
  readonly findAll: () => Effect.Effect<TeamNavVM[]>;
  readonly findBySlug: (slug: string) => Effect.Effect<TeamDetailVM | null>;
}

export class TeamRepository extends Context.Tag("TeamRepository")<
  TeamRepository,
  TeamRepositoryInterface
>() {}

const fetchGroq = <T>(query: string, params?: Record<string, unknown>) =>
  Effect.tryPromise({
    try: () => sanityClient.fetch<T>(query, params ?? {}),
    catch: (cause) => new Error(`Sanity fetch failed: ${String(cause)}`),
  }).pipe(Effect.orDie);

export const TeamRepositoryLive = Layer.succeed(TeamRepository, {
  findAll: () =>
    fetchGroq<TEAMS_QUERY_RESULT>(TEAMS_QUERY).pipe(
      Effect.map((rows) => rows.map(toTeamNavVM)),
    ),
  findBySlug: (slug) =>
    fetchGroq<TEAM_BY_SLUG_QUERY_RESULT>(TEAM_BY_SLUG_QUERY, { slug }).pipe(
      Effect.map((row) => (row ? toTeamDetailVM(row) : null)),
    ),
});
