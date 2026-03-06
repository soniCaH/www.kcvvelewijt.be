import { createClient } from "@sanity/client";
import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";

// ─── Document shapes written to Sanity ───────────────────────────────────────

export interface SanityPlayerDoc {
  psdId: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null; // "YYYY-MM-DD" (time component stripped from PSD)
  nationality: string | null;
  keeper: boolean;
  positionPsd: string | null; // from PSD bestPosition — null until KCVV populates
  psdImageUrl: string | null; // absolute URL (base prepended)
}

export interface SanityTeamDoc {
  psdId: string;
  name: string;
  slug: string;
  age: string; // "A", "U17", etc.
  gender: string;
  footbelId: number | null;
  playerPsdIds: string[];
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class SanityWriteError extends Error {
  readonly _tag = "SanityWriteError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SanityWriteError";
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface SanityWriteClientInterface {
  readonly upsertPlayer: (
    doc: SanityPlayerDoc,
  ) => Effect.Effect<void, SanityWriteError>;
  readonly upsertTeam: (
    doc: SanityTeamDoc,
  ) => Effect.Effect<void, SanityWriteError>;
}

export class SanityWriteClient extends Context.Tag("SanityWriteClient")<
  SanityWriteClient,
  SanityWriteClientInterface
>() {}

// ─── Live layer ───────────────────────────────────────────────────────────────

/**
 * Upsert strategy: createIfNotExists sets the document skeleton on first run.
 * patch().set() overwrites only PSD-sourced fields — never touches editorial
 * fields (transparentImage, celebrationImage, position, bio, trainingSchedule, staff).
 */
export const SanityWriteClientLive = Layer.effect(
  SanityWriteClient,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const client = createClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      apiVersion: "2024-01-01",
      token: env.SANITY_API_TOKEN,
      useCdn: false,
    });

    const docId = (type: string, psdId: string) => `${type}-psd-${psdId}`;

    const upsert = <T extends Record<string, unknown>>(
      type: string,
      psdId: string,
      psdFields: T,
    ) =>
      Effect.tryPromise({
        try: () =>
          client
            .transaction()
            .createIfNotExists({ _id: docId(type, psdId), _type: type, psdId })
            .patch(docId(type, psdId), (p) => p.set(psdFields))
            .commit(),
        catch: (cause) =>
          new SanityWriteError(`Failed to upsert ${type} ${psdId}`, cause),
      }).pipe(Effect.asVoid);

    return {
      upsertPlayer: (doc) =>
        upsert("player", doc.psdId, {
          firstName: doc.firstName,
          lastName: doc.lastName,
          birthDate: doc.birthDate,
          nationality: doc.nationality,
          keeper: doc.keeper,
          positionPsd: doc.positionPsd,
          psdImageUrl: doc.psdImageUrl,
        }),

      upsertTeam: (doc) =>
        upsert("team", doc.psdId, {
          name: doc.name,
          slug: { _type: "slug", current: doc.slug },
          age: doc.age,
          gender: doc.gender,
          footbelId: doc.footbelId,
          players: doc.playerPsdIds.map((id) => ({
            _type: "reference",
            _ref: `player-psd-${id}`,
            _key: id,
          })),
        }),
    };
  }),
);
