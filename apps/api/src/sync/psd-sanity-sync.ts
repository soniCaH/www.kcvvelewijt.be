import { Effect } from "effect";
import type { PsdMember, PsdTeam } from "@kcvv/api-contract";
import type { SanityPlayerDoc, SanityTeamDoc } from "../sanity/client";
import { SanityWriteClient } from "../sanity/client";
import { FootbalistoClient } from "../footbalisto/client";
import { WorkerEnvTag } from "../env";

// ─── Transforms ───────────────────────────────────────────────────────────────

export function transformMember(
  psd: PsdMember,
  baseUrl: string,
): SanityPlayerDoc {
  return {
    psdId: String(psd.id),
    firstName: psd.firstName,
    lastName: psd.lastName,
    birthDate: psd.birthDate ? psd.birthDate.split(" ")[0]! : null, // strip time "HH:MM"
    nationality: psd.nationality,
    keeper: psd.keeper,
    positionPsd:
      typeof psd.bestPosition === "string"
        ? psd.bestPosition
        : psd.bestPosition !== null
          ? psd.bestPosition.type.name
          : null,
    psdImageUrl: psd.profilePictureURL
      ? `${baseUrl}${psd.profilePictureURL}`
      : null,
  };
}

export function transformTeam(
  psd: PsdTeam,
  playerPsdIds: string[],
): SanityTeamDoc {
  const slug = psd.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    psdId: String(psd.id),
    name: psd.name,
    slug,
    age: psd.age,
    gender: psd.gender,
    footbelId: psd.footbelId,
    playerPsdIds,
  };
}

// ─── Sync effect ──────────────────────────────────────────────────────────────

/**
 * Fetches all club teams + members from PSD and upserts into Sanity.
 * Teams are processed sequentially; players per team are upserted with concurrency 5.
 * Only PSD-sourced fields are written — editorial fields are never touched.
 */
export const runSync = Effect.gen(function* () {
  const psd = yield* FootbalistoClient;
  const sanity = yield* SanityWriteClient;
  const env = yield* WorkerEnvTag;
  const baseUrl = env.PSD_API_BASE_URL;

  const teams = yield* psd.getRawTeams();

  yield* Effect.forEach(
    teams,
    (team) =>
      Effect.gen(function* () {
        const members = yield* psd.getRawMembers(team.id);
        const activePlayers = members.filter((m) => m.active);

        yield* Effect.forEach(
          activePlayers,
          (m) => sanity.upsertPlayer(transformMember(m, baseUrl)),
          { concurrency: 5 },
        );

        const playerPsdIds = activePlayers.map((m) => String(m.id));
        yield* sanity.upsertTeam(transformTeam(team, playerPsdIds));
      }),
    { concurrency: 1 }, // teams sequentially to avoid rate limits
  );
}).pipe(
  Effect.tapError((e) =>
    Effect.log(
      `Sync failed: ${String(e)} | cause: ${e instanceof Error && e.cause ? String(e.cause) : "none"}`,
    ),
  ),
  Effect.annotateLogs({ service: "psd-sanity-sync" }),
);
