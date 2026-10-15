/**
 * #3468: the AI answer has a daily cap and a token ceiling. Workers AI is
 * stubbed; the counter runs on the real KvCacheLive over an in-memory KV.
 */
import { describe, expect, it, vi } from "vitest";
import { Effect, Layer, Logger } from "effect";
import { AiAnswerService, AiAnswerServiceLive } from "./ai-answer";
import { KvCacheLive } from "../cache/kv-cache";
import { utcDay } from "../cache/daily-ceiling";
import { makeTestEnvLayer } from "../test-helpers/env-layer";

function setup(cap: string | undefined, answersToday?: number) {
  const store = new Map<string, string>();
  if (answersToday !== undefined)
    store.set(`ai:answers:${utcDay()}`, String(answersToday));
  const kv = {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
  } as unknown as KVNamespace;
  const run = vi.fn(async () => ({ response: "Een antwoord." }));
  const errors: string[] = [];
  const layer = AiAnswerServiceLive.pipe(
    Layer.provideMerge(KvCacheLive),
    Layer.provideMerge(
      makeTestEnvLayer({
        PSD_CACHE: kv,
        AI: { run } as unknown as Ai,
        AI_ANSWER_DAILY_CAP: cap,
      }),
    ),
  );
  const logger = Logger.replace(
    Logger.defaultLogger,
    Logger.make(({ logLevel, message }) => {
      if (logLevel._tag === "Error") errors.push(String(message));
    }),
  );
  const answer = () =>
    Effect.runPromise(
      Effect.flatMap(AiAnswerService, (ai) =>
        ai.generateAnswer("waar is de kantine?", "1. Kantine: uitleg"),
      ).pipe(Effect.provide(layer), Effect.provide(logger)),
    );
  return { answer, run, store, errors };
}

describe("AiAnswerServiceLive (#3468)", () => {
  it("passes max_tokens: 256 to the model", async () => {
    const { answer, run } = setup("2000");
    await answer();
    expect(run).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ max_tokens: 256 }),
    );
  });

  it("counts each successful answer under ai:answers:{UTC day}", async () => {
    const { answer, store } = setup("2000", 4);
    expect(await answer()).toBe("Een antwoord.");
    expect(store.get(`ai:answers:${utcDay()}`)).toBe("5");
  });

  it("at the cap, returns no answer and makes no LLM call", async () => {
    const { answer, run } = setup("2000", 2000);
    expect(await answer()).toBeUndefined();
    expect(run).not.toHaveBeenCalled();
  });

  it("at the cap, logs one error per day, not one per search", async () => {
    const { answer, errors } = setup("2000", 2000);
    await answer();
    await answer();
    expect(errors.filter((e) => e.includes("daily cap"))).toHaveLength(1);
  });
});
