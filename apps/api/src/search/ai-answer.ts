import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";
import { KvCacheService } from "../cache/kv-cache";
import {
  oncePerDay,
  parseCeiling,
  parseCount,
  utcDay,
} from "../cache/daily-ceiling";

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
  /**
   * The `/hulp` team card's AI fallback (#3559): one of `ages` for a query the
   * rules found no team for, or `null` when the model named none of them.
   * `undefined` when the model was not asked (daily cap) or failed — a
   * caller may cache a `null`, never an `undefined`. Same model and daily cap
   * as answers.
   */
  readonly guessTeam: (
    query: string,
    ages: readonly string[],
  ) => Effect.Effect<string | null | undefined>;
}

export class AiAnswerService extends Context.Tag("AiAnswerService")<
  AiAnswerService,
  AiAnswerServiceInterface
>() {}

// The plain `llama-3.1-8b-instruct` left the Workers AI catalog; every call
// threw `AiError` and was swallowed as "degraded" (#3582).
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

const SYSTEM_PROMPT =
  "Je bent een assistent voor voetbalclub KCVV Elewijt. " +
  "Beantwoord de vraag beknopt en duidelijk in het Nederlands op basis van de gegeven context. " +
  "Geef geen antwoord als de context geen relevant antwoord bevat. " +
  "Antwoord in maximaal 3 zinnen.";

const TEAM_GUESS_PROMPT = (ages: readonly string[]) =>
  "Je helpt ouders bij voetbalclub KCVV Elewijt de jeugdploeg van hun kind te vinden. " +
  "Een ploeg heet naar de leeftijdscategorie: U9 is voor kinderen onder 9 jaar. " +
  `De club heeft enkel deze ploegen: ${ages.join(", ")}. ` +
  "Antwoord met precies één code uit die lijst, of met none als je het niet zeker weet. " +
  "Schrijf niets anders.";

/**
 * The model's reply as one of `ages`, or `null`. Only a bare code counts —
 * `"Ik denk U9"` or `"U9 of U10"` is not a pick, and neither is a code that
 * is not on the list.
 */
export const allowedAge = (
  reply: string,
  ages: readonly string[],
): string | null => {
  const code = reply
    .trim()
    .replace(/^["'`]+|["'`.!]+$/g, "")
    .toUpperCase();
  return ages.includes(code) ? code : null;
};

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
    const logCappedOncePerDay = (day: string, count: number, max: number) =>
      oncePerDay(
        cache,
        cappedLoggedKey(day),
        Effect.logError(
          `[Workers AI] daily cap reached (${count}/${max} answers on ${day}) — /search serves results without an answer until midnight UTC`,
        ),
      );

    const run = (
      system: string,
      user: string,
      // Bounds the bill if the model does not listen to the prompt (#3468).
      maxTokens: number,
    ) =>
      Effect.tryPromise({
        try: async () => {
          const messages = [
            { role: "system" as const, content: system },
            { role: "user" as const, content: user },
          ];
          const ai = env.AI as unknown as {
            run: (model: string, input: unknown) => Promise<unknown>;
          };
          const result = (await ai.run(MODEL, {
            messages,
            max_tokens: maxTokens,
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
          // `message` too: a serialised Error keeps only its name (#3582).
          Effect.logWarning("[Workers AI] degraded — answer skipped", {
            cause,
            message: cause instanceof Error ? cause.message : String(cause),
          }).pipe(Effect.map(() => undefined)),
        ),
      );

    /** One model call under the daily cap; counted only when it replied. */
    const metered = (call: Effect.Effect<string | undefined>) =>
      Effect.gen(function* () {
        const day = utcDay();
        const count = parseCount(yield* cache.get(answersKey(day)));
        if (cap !== undefined && count >= cap) {
          yield* logCappedOncePerDay(day, count, cap);
          return undefined;
        }
        const reply = yield* call;
        if (reply !== undefined)
          yield* cache.set(answersKey(day), String(count + 1), COUNTER_TTL);
        return reply;
      });

    return {
      generateAnswer: (query: string, context: string) =>
        // The prompt asks for 3 sentences.
        metered(
          run(
            SYSTEM_PROMPT,
            `Context:\n${context}\n\nVraag: ${query}\n\nAntwoord:`,
            256,
          ),
        ),
      guessTeam: (query: string, ages: readonly string[]) =>
        // One code or "none" is a few tokens.
        metered(run(TEAM_GUESS_PROMPT(ages), query, 8)).pipe(
          Effect.map((reply) =>
            reply === undefined ? undefined : allowedAge(reply, ages),
          ),
        ),
    };
  }),
);
