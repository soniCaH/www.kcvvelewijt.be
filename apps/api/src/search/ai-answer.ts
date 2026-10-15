import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";
import { KvCacheService, parseCeiling, utcDay } from "../cache/kv-cache";

export class AiAnswerError extends Error {
  readonly _tag = "AiAnswerError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export interface AiAnswerServiceInterface {
  readonly generateAnswer: (
    query: string,
    context: string,
  ) => Effect.Effect<string | undefined, AiAnswerError>;
}

export class AiAnswerService extends Context.Tag("AiAnswerService")<
  AiAnswerService,
  AiAnswerServiceInterface
>() {}

const MODEL = "@cf/meta/llama-3.1-8b-instruct";

const SYSTEM_PROMPT =
  "Je bent een assistent voor voetbalclub KCVV Elewijt. " +
  "Beantwoord de vraag beknopt en duidelijk in het Nederlands op basis van de gegeven context. " +
  "Geef geen antwoord als de context geen relevant antwoord bevat. " +
  "Antwoord in maximaal 3 zinnen.";

/** KV day counter of AI answers; kept 2 days so yesterday stays readable. */
const answersKey = (day: string) => `ai:answers:${day}`;
const cappedLoggedKey = (day: string) => `ai:answers:capped:${day}`;
const COUNTER_TTL = 60 * 60 * 24 * 2;

export const AiAnswerServiceLive = Layer.effect(
  AiAnswerService,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const cache = yield* KvCacheService;
    const cap = parseCeiling(env.AI_ANSWER_DAILY_CAP);

    // Daily cap (#3468): Workers AI has no hard spending cap. Approximate —
    // KV is not atomic — which is fine for a ceiling.
    const answersToday = (day: string) =>
      Effect.map(cache.get(answersKey(day)), (raw) => {
        const n = Number.parseInt(raw ?? "0", 10);
        return Number.isFinite(n) ? n : 0;
      });

    const logCappedOncePerDay = (day: string, count: number, max: number) =>
      Effect.gen(function* () {
        if ((yield* cache.get(cappedLoggedKey(day))) !== null) return;
        yield* cache.set(cappedLoggedKey(day), "1", COUNTER_TTL);
        yield* Effect.logError(
          `[Workers AI] daily cap reached (${count}/${max} answers on ${day}) — /search serves results without an answer until midnight UTC`,
        );
      });

    const run = (query: string, context: string) =>
      Effect.tryPromise({
        try: async () => {
          const messages = [
            { role: "system" as const, content: SYSTEM_PROMPT },
            {
              role: "user" as const,
              content: `Context:\n${context}\n\nVraag: ${query}\n\nAntwoord:`,
            },
          ];
          const ai = env.AI as unknown as {
            run: (model: string, input: unknown) => Promise<unknown>;
          };
          // The prompt asks for 3 sentences; this bounds the bill if it
          // does not listen (#3468).
          const result = (await ai.run(MODEL, {
            messages,
            max_tokens: 256,
          })) as {
            response?: string;
          };
          return result.response?.trim() || undefined;
        },
        catch: (cause) =>
          new AiAnswerError(`AI answer failed: ${String(cause)}`, cause),
      }).pipe(
        Effect.timeout("8 seconds"),
        Effect.catchAll((cause) =>
          Effect.logWarning("[Workers AI] degraded — answer skipped", {
            cause,
          }).pipe(Effect.map(() => undefined)),
        ),
      );

    return {
      generateAnswer: (query: string, context: string) =>
        Effect.gen(function* () {
          const day = utcDay();
          const count = yield* answersToday(day);
          if (cap !== undefined && count >= cap) {
            yield* logCappedOncePerDay(day, count, cap);
            return undefined;
          }
          const answer = yield* run(query, context);
          if (answer !== undefined)
            yield* cache.set(answersKey(day), String(count + 1), COUNTER_TTL);
          return answer;
        }),
    };
  }),
);
