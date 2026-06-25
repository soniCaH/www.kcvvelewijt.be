import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import { SANITY_LIST_REVALIDATE, SANITY_TAGS } from "../sanity/cache-tags";
import type {
  TEAMS_QUERY_RESULT,
  TEAM_BY_SLUG_QUERY_RESULT,
  TEAMS_LANDING_QUERY_RESULT,
} from "../sanity/sanity.types";
import { toPlayerVM, type PlayerVM } from "./player.repository";
import type { TeamLandingItem } from "../utils/group-teams";
import type { TeamStaffMember } from "../team-role-resolution";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const TEAMS_QUERY =
  defineQuery(`*[_type == "team" && archived != true && showInNavigation != false] | order(name asc) {
  _id, psdId, name, "slug": slug.current, age, gender, footbelId, division, divisionFull,
  tagline,
  "teamImageUrl": teamImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
}`);

export const TEAM_BY_SLUG_QUERY =
  defineQuery(`*[_type == "team" && slug.current == $slug][0] {
  _id, psdId, name, "slug": slug.current, age, gender, footbelId, division, divisionFull,
  season,
  tagline, body[]{ ..., "fileUrl": file.asset->url }, contactInfo,
  "teamImageUrl": teamImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  trainingSchedule,
  players[]-> {
    _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
    "psdImageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
    "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max"
  },
  staff[] { role, "member": member-> { _id, psdId, archived, firstName, lastName, functionTitle, "photoUrl": photo.asset->url + "?w=200&q=80&fm=webp&fit=max", "hasBio": count(bio) > 0 } }
}`);

export const YOUTH_TEAMS_CONTACT_QUERY =
  defineQuery(`*[_type == "team" && archived != true && defined(age) && age match "U*"] | order(name asc) {
  _id, name, "slug": slug.current, age,
  staff[defined(member) && !member->archived] { role, "member": member-> { _id, firstName, lastName, email, phone } }
}`);

export const TEAMS_LANDING_QUERY =
  defineQuery(`*[_type == "team" && archived != true && showInNavigation != false && defined(age)] | order(name asc) {
  _id, name, "slug": slug.current, age,
  division, divisionFull, season, tagline,
  "teamImageUrl": teamImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",
  staff[] { role, "member": member-> { firstName, lastName, functionTitle } }
}`);

// ─── View Models ─────────────────────────────────────────────────────────────

// Manual result type for YOUTH_TEAMS_CONTACT_QUERY (typegen will generate this later)
type YouthTeamContactRow = {
  _id: string;
  name: string | null;
  slug: string | null;
  age: string | null;
  staff: Array<{
    role: string | null;
    member: {
      _id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
    } | null;
  }> | null;
};

export interface YouthTeamForContactVM {
  id: string;
  name: string;
  slug: string;
  age: string;
  staff: TeamStaffMember[];
}

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
  functionTitle?: string;
  imageUrl?: string;
  /**
   * Canonical staff-detail URL (`/staf/{psdId}`) — only set when a detail
   * page exists for this member: a non-archived `staffMember` doc carrying a
   * `psdId` (the `/staf/[slug]` route key). Absent → the card renders without
   * a link.
   */
  href?: string;
}

export interface TeamDetailVM {
  id: string;
  name: string;
  slug: string;
  age: string | null;
  psdId: string | null;
  footbelId: number | null;
  division: string | null;
  divisionFull: string | null;
  season: string | null;
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
): StaffMemberVM | null {
  if (!row.member) return null;
  // A staff-detail page is reachable only for a non-archived member with a
  // psdId (the `/staf/[slug]` route key + `generateStaticParams` filter).
  // BEST-2: also require actual bio content — without it the detail page is a
  // hero-only shell, so the card stays non-clickable until a bio is added
  // (backfill tracked in #2243).
  const psdId = row.member.psdId != null ? String(row.member.psdId).trim() : "";
  const hasDetailPage =
    psdId !== "" && row.member.archived !== true && row.member.hasBio === true;
  return {
    id: row.member._id,
    firstName: row.member.firstName ?? "",
    lastName: row.member.lastName ?? "",
    role: row.role ?? row.member.functionTitle ?? "",
    functionTitle: row.member.functionTitle ?? undefined,
    imageUrl: row.member.photoUrl ?? undefined,
    ...(hasDetailPage ? { href: `/staf/${psdId}` } : {}),
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
    division: row.division,
    divisionFull: row.divisionFull,
    season: row.season ?? null,
    tagline: computeTagline(row),
    teamType: computeTeamType(row.age),
    ageGroup: computeAgeGroup(row.age),
    teamImageUrl: row.teamImageUrl,
    body: row.body,
    contactInfo: row.contactInfo,
    trainingSchedule: row.trainingSchedule,
    players: (row.players ?? []).map(toPlayerVM),
    staff: (row.staff ?? [])
      .map(toStaffMemberVM)
      .filter((s): s is StaffMemberVM => s !== null),
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
    season: row.season ?? null,
    tagline: row.tagline,
    teamImageUrl: row.teamImageUrl,
    staff:
      row.staff
        ?.filter(
          (s): s is typeof s & { member: NonNullable<typeof s.member> } =>
            s.member !== null,
        )
        .map((s) => ({
          firstName: s.member.firstName ?? "",
          lastName: s.member.lastName ?? "",
          role: s.role ?? s.member.functionTitle ?? "",
        })) ?? null,
  };
}

function toYouthTeamForContactVM(
  row: YouthTeamContactRow,
): YouthTeamForContactVM {
  return {
    id: row._id,
    name: row.name ?? "",
    slug: row.slug ?? "",
    age: row.age ?? "",
    staff: (row.staff ?? [])
      .filter(
        (s): s is typeof s & { member: NonNullable<typeof s.member> } =>
          s.member !== null && !!s.role,
      )
      .map((s) => ({
        id: s.member._id,
        firstName: s.member.firstName ?? "",
        lastName: s.member.lastName ?? "",
        role: s.role!,
        ...(s.member.email ? { email: s.member.email } : {}),
        ...(s.member.phone ? { phone: s.member.phone } : {}),
      })),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface TeamRepositoryInterface {
  readonly findAll: () => Effect.Effect<TeamNavVM[]>;
  readonly findBySlug: (slug: string) => Effect.Effect<TeamDetailVM | null>;
  readonly findAllForLanding: () => Effect.Effect<TeamLandingItem[]>;
  readonly findYouthTeamsForContact: () => Effect.Effect<
    YouthTeamForContactVM[]
  >;
}

export class TeamRepository extends Context.Tag("TeamRepository")<
  TeamRepository,
  TeamRepositoryInterface
>() {}

export const TeamRepositoryLive = Layer.succeed(TeamRepository, {
  findAll: () =>
    fetchGroq<TEAMS_QUERY_RESULT>(TEAMS_QUERY, undefined, {
      revalidate: SANITY_LIST_REVALIDATE,
      tags: [SANITY_TAGS.teams],
    }).pipe(Effect.map((rows) => rows.map(toTeamNavVM))),
  findBySlug: (slug) =>
    fetchGroq<TEAM_BY_SLUG_QUERY_RESULT>(TEAM_BY_SLUG_QUERY, { slug }).pipe(
      Effect.map((row) => (row ? toTeamDetailVM(row) : null)),
    ),
  findAllForLanding: () =>
    fetchGroq<TEAMS_LANDING_QUERY_RESULT>(TEAMS_LANDING_QUERY).pipe(
      Effect.map((rows) => rows.map(toTeamLandingItem)),
    ),
  findYouthTeamsForContact: () =>
    fetchGroq<YouthTeamContactRow[]>(YOUTH_TEAMS_CONTACT_QUERY).pipe(
      Effect.map((rows) => rows.map(toYouthTeamForContactVM)),
    ),
});
