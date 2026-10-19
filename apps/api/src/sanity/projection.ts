import { createClient } from "@sanity/client";
import { Context, Effect, Layer } from "effect";
import {
  TVJO_ROLE_CODE,
  YOUTH_COORDINATOR_ROLE_CODES,
} from "@kcvv/api-contract";
import { WorkerEnvTag } from "../env";
import { derivePsdTeamLabel } from "../psd/transforms";
import type { PlayerImageState, StaffImageState } from "./types";
import { sanityClientConfig } from "./config";

// ─── Error ────────────────────────────────────────────────────────────────────

export class SanityQueryError extends Error {
  readonly _tag = "SanityQueryError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SanityQueryError";
  }
}

/** Per-role admin-notification recipients from the formRoutingConfig singleton. */
export interface FormRoutingConfig {
  speler: string | null;
  jeugdspeler: string | null;
  vrijwilliger: string | null;
  trainer: string | null;
  scheidsrechter: string | null;
}

/** The weekly staff-gaps nudge's read (#3561) — see `sync/staff-gaps-check.ts`. */
export interface StaffGaps {
  /** One row per team staff entry whose role is still empty ("not done yet"; `andere` is a real answer). */
  readonly emptyRoles: ReadonlyArray<{
    readonly teamId: string;
    readonly teamName: string | null;
    readonly memberName: string | null;
  }>;
  /** Staff members on those teams with neither an editor `photo` nor a synced `psdImage`. */
  readonly noPhoto: ReadonlyArray<{
    readonly id: string;
    readonly name: string | null;
  }>;
  /** Coordinator organigram nodes that are inactive or have no live member. */
  readonly coordinators: ReadonlyArray<{
    readonly id: string;
    readonly roleCode: string;
    readonly title: string | null;
    readonly active: boolean;
    /** Live members only — an archived or dangling reference does not count. */
    readonly memberCount: number;
  }>;
  /** Coordinator role codes no organigram node carries at all. */
  readonly missingRoleCodes: ReadonlyArray<string>;
}

/** A current player or staff member with a stored birth date — the birthday post's read (#3570). */
export interface BirthdayPerson {
  readonly name: string;
  /** "YYYY-MM-DD" as stored on the Sanity document. */
  readonly birthDate: string;
  /** Team name, or the staff function when the person is on no team. */
  readonly label: string | null;
}

/** Organigram role codes the weekly nudge expects to be filled (#3420 Q9). */
export const COORDINATOR_ROLE_CODES = [
  TVJO_ROLE_CODE,
  ...Object.values(YOUTH_COORDINATOR_ROLE_CODES),
];

const ACTIVE_PSD_TEAM = `_type == "team" && archived != true && defined(psdId) && psdId != ""`;

/** A node's members the web shows (`members[@->archived != true]->`, minus dangling refs). */
const LIVE_MEMBERS = `coalesce(members[defined(@->_id) && @->archived != true], [])`;

const STAFF_GAPS_QUERY = `{
  "emptyRoles": *[${ACTIVE_PSD_TEAM}] | order(name asc) {
    "teamId": _id,
    "teamName": name,
    "entries": staff[!defined(role) || role == ""]{ "firstName": member->firstName, "lastName": member->lastName }
  }[count(entries) > 0],
  "noPhoto": *[_type == "staffMember" && !defined(photo) && !defined(psdImage)
    && _id in *[${ACTIVE_PSD_TEAM}].staff[].member._ref] | order(lastName asc) {
    "id": _id, firstName, lastName
  },
  "coordinators": *[_type == "organigramNode" && roleCode in $coordinatorCodes
    && (active != true || count(${LIVE_MEMBERS}) == 0)] | order(roleCode asc) {
    "id": _id, roleCode, title, "active": active == true, "memberCount": count(${LIVE_MEMBERS})
  },
  "missingRoleCodes": $coordinatorCodes[!(@ in *[_type == "organigramNode"].roleCode)]
}`;

/**
 * "Current" mirrors the web: not archived, and either on a non-archived,
 * nav-visible team (`references()` matches `players[]` and `staff[].member`)
 * or, for staff, a member of an active organigram node.
 */
const CURRENT_TEAMS_OF_MEMBER = `*[_type == "team" && archived != true && showInNavigation != false && references(^._id)]`;

const BIRTHDAY_QUERY = `*[_type in ["player", "staffMember"] && archived != true && defined(birthDate) && (
  count(${CURRENT_TEAMS_OF_MEMBER}) > 0
  || (_type == "staffMember" && _id in *[_type == "organigramNode" && active == true].members[]._ref)
)] {
  firstName, lastName, birthDate,
  "team": ${CURRENT_TEAMS_OF_MEMBER} | order(name asc)[0]{ name, age },
  "role": functionTitle
}`;

const fullName = (p: {
  firstName: string | null;
  lastName: string | null;
}): string | null =>
  [p.firstName, p.lastName].filter(Boolean).join(" ") || null;

// ─── Service ──────────────────────────────────────────────────────────────────

export interface SanityProjectionInterface {
  /** Fetch PSD IDs of all teams where showInNavigation is not false. */
  readonly getVisibleTeamPsdIds: () => Effect.Effect<
    string[],
    SanityQueryError
  >;
  /** Fetch existing psdImageUrl + psdImage presence for all player docs. */
  readonly getPlayersImageState: () => Effect.Effect<
    Map<string, PlayerImageState>,
    SanityQueryError
  >;
  /** Fetch existing psdImageUrl + psdImage presence for all staff docs. */
  readonly getStaffImageState: () => Effect.Effect<
    Map<string, StaffImageState>,
    SanityQueryError
  >;
  /** Fetch PSD IDs of all non-archived players. */
  readonly getActivePlayerPsdIds: () => Effect.Effect<
    string[],
    SanityQueryError
  >;
  /** Fetch PSD IDs of all non-archived staff members. */
  readonly getActiveStaffPsdIds: () => Effect.Effect<
    string[],
    SanityQueryError
  >;
  /** Fetch PSD IDs of the players a team document currently references (empty when the team doc is missing). */
  readonly getTeamPlayerPsdIds: (
    teamPsdId: string,
  ) => Effect.Effect<string[], SanityQueryError>;
  /** Fetch PSD IDs of all non-archived teams. */
  readonly getActiveTeamPsdIds: () => Effect.Effect<string[], SanityQueryError>;
  /** Fetch PSD IDs of staff members referenced by active organigramNode or responsibility documents. */
  readonly getProtectedStaffPsdIds: () => Effect.Effect<
    string[],
    SanityQueryError
  >;
  /** One read of every staff/coordinator gap the weekly Slack nudge reports (#3561). */
  readonly getStaffGaps: () => Effect.Effect<StaffGaps, SanityQueryError>;
  /** One read of every current player and staff member with a birth date (#3570). */
  readonly getBirthdayPeople: () => Effect.Effect<
    BirthdayPerson[],
    SanityQueryError
  >;
  /** Fetch the formRoutingConfig singleton (null per-role field → no override). */
  readonly getFormRoutingConfig: () => Effect.Effect<
    FormRoutingConfig | null,
    SanityQueryError
  >;
}

export class SanityProjection extends Context.Tag("SanityProjection")<
  SanityProjection,
  SanityProjectionInterface
>() {}

// ─── Live layer ───────────────────────────────────────────────────────────────

export const SanityProjectionLive = Layer.effect(
  SanityProjection,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const client = createClient({
      ...sanityClientConfig(env),
      useCdn: false,
    });

    return {
      getVisibleTeamPsdIds: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<Array<string | null>>(
              `*[_type == "team" && showInNavigation != false].psdId`,
            );
            return rows.filter(
              (id): id is string => typeof id === "string" && id.length > 0,
            );
          },
          catch: (cause) =>
            new SanityQueryError("Failed to fetch visible team PSD IDs", cause),
        }),

      getPlayersImageState: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<
              Array<{
                psdId: string;
                psdImageUrl: string | null;
                hasPsdImage: boolean;
              }>
            >(
              `*[_type == "player" && defined(psdId) && psdId != ""] { psdId, psdImageUrl, "hasPsdImage": defined(psdImage) }`,
            );
            return new Map(
              rows.map((r) => [
                r.psdId,
                { psdImageUrl: r.psdImageUrl, hasPsdImage: r.hasPsdImage },
              ]),
            );
          },
          catch: (cause) =>
            new SanityQueryError("Failed to fetch player image state", cause),
        }),

      getStaffImageState: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<
              Array<{
                psdId: string;
                psdImageUrl: string | null;
                hasPsdImage: boolean;
              }>
            >(
              `*[_type == "staffMember" && defined(psdId) && psdId != ""] { psdId, psdImageUrl, "hasPsdImage": defined(psdImage) }`,
            );
            return new Map(
              rows.map((r) => [
                r.psdId,
                { psdImageUrl: r.psdImageUrl, hasPsdImage: r.hasPsdImage },
              ]),
            );
          },
          catch: (cause) =>
            new SanityQueryError("Failed to fetch staff image state", cause),
        }),

      getActivePlayerPsdIds: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<Array<{ psdId: string }>>(
              `*[_type == "player" && archived != true && defined(psdId) && psdId != ""] { psdId }`,
            );
            return rows.map((r) => r.psdId);
          },
          catch: (cause) =>
            new SanityQueryError(
              "Failed to fetch active player PSD IDs",
              cause,
            ),
        }),

      getActiveStaffPsdIds: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<Array<{ psdId: string }>>(
              `*[_type == "staffMember" && archived != true && defined(psdId) && psdId != ""] { psdId }`,
            );
            return rows.map((r) => r.psdId);
          },
          catch: (cause) =>
            new SanityQueryError("Failed to fetch active staff PSD IDs", cause),
        }),

      getTeamPlayerPsdIds: (teamPsdId) =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<Array<string | null> | null>(
              `*[_type == "team" && psdId == $teamPsdId][0].players[]->psdId`,
              { teamPsdId },
            );
            return (rows ?? []).filter(
              (id): id is string => typeof id === "string" && id.length > 0,
            );
          },
          catch: (cause) =>
            new SanityQueryError(
              `Failed to fetch player PSD IDs of team ${teamPsdId}`,
              cause,
            ),
        }),

      getActiveTeamPsdIds: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<Array<{ psdId: string }>>(
              `*[_type == "team" && archived != true && defined(psdId) && psdId != ""] { psdId }`,
            );
            return rows.map((r) => r.psdId);
          },
          catch: (cause) =>
            new SanityQueryError("Failed to fetch active team PSD IDs", cause),
        }),

      getProtectedStaffPsdIds: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<Array<string | null>>(
              `*[_type == "staffMember" && defined(psdId) && psdId != "" && (
                _id in *[_type == "organigramNode" && active == true].members[]._ref
                ||
                _id in *[_type == "responsibility" && active == true].primaryContact.organigramNode->members[]._ref
                ||
                _id in *[_type == "responsibility" && active == true].steps[].contact.organigramNode->members[]._ref
              )].psdId`,
            );
            return rows.filter(
              (id): id is string => typeof id === "string" && id.length > 0,
            );
          },
          catch: (cause) =>
            new SanityQueryError(
              "Failed to fetch protected staff PSD IDs",
              cause,
            ),
        }),

      getStaffGaps: () =>
        Effect.tryPromise({
          try: async (): Promise<StaffGaps> => {
            type Name = { firstName: string | null; lastName: string | null };
            const rows = await client.fetch<{
              emptyRoles: Array<{
                teamId: string;
                teamName: string | null;
                entries: Name[];
              }>;
              noPhoto: Array<Name & { id: string }>;
              coordinators: StaffGaps["coordinators"];
              missingRoleCodes: string[];
            }>(STAFF_GAPS_QUERY, { coordinatorCodes: COORDINATOR_ROLE_CODES });
            return {
              emptyRoles: rows.emptyRoles.flatMap((t) =>
                t.entries.map((e) => ({
                  teamId: t.teamId,
                  teamName: t.teamName,
                  memberName: fullName(e),
                })),
              ),
              noPhoto: rows.noPhoto.map((s) => ({
                id: s.id,
                name: fullName(s),
              })),
              coordinators: rows.coordinators,
              missingRoleCodes: rows.missingRoleCodes,
            };
          },
          catch: (cause) =>
            new SanityQueryError("Failed to fetch staff gaps", cause),
        }),

      getBirthdayPeople: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<
              Array<{
                firstName: string | null;
                lastName: string | null;
                birthDate: string;
                team: { name: string | null; age: string | null } | null;
                role: string | null;
              }>
            >(BIRTHDAY_QUERY);
            return rows.flatMap((r) => {
              const name = fullName(r);
              return name === null
                ? []
                : [
                    {
                      name,
                      birthDate: r.birthDate,
                      // The raw PSD name reads "KCVVE  U11 " — label it like every other surface (#3598)
                      label: r.team?.name
                        ? derivePsdTeamLabel(r.team.name, r.team.age ?? "")
                        : r.role,
                    },
                  ];
            });
          },
          catch: (cause) =>
            new SanityQueryError("Failed to fetch birthday people", cause),
        }),

      getFormRoutingConfig: () =>
        Effect.tryPromise({
          try: () =>
            client.fetch<FormRoutingConfig | null>(
              `*[_type == "formRoutingConfig"][0]{ speler, jeugdspeler, vrijwilliger, trainer, scheidsrechter }`,
            ),
          catch: (cause) =>
            new SanityQueryError("Failed to fetch form routing config", cause),
        }),
    };
  }),
);
