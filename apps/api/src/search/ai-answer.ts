import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";

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

export const AiAnswerServiceLive = Layer.effect(
  AiAnswerService,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    return {
      generateAnswer: (query: string, context: string) =>
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
            const result = (await ai.run(MODEL, { messages })) as {
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
        ),
    };
  }),
);
