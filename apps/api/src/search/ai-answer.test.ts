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

function setup(
  cap: string | undefined,
  answersToday?: number,
  reply = "Een antwoord.",
) {
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
  const run = vi.fn(async () => ({ response: reply }));
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
  const guess = (ages = ["U8", "U9", "U10"]) =>
    Effect.runPromise(
      Effect.flatMap(AiAnswerService, (ai) =>
        ai.guessTeam("mijn zoon speelt bij de pupillen", ages),
      ).pipe(Effect.provide(layer), Effect.provide(logger)),
    );
  return { answer, guess, run, store, errors };
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

describe("AiAnswerServiceLive.guessTeam (#3559)", () => {
  it("returns the age the model picked from the list", async () => {
    const { guess } = setup("2000", 0, "U9");
    expect(await guess()).toBe("U9");
  });

  it("tolerates case, quotes and a trailing full stop", async () => {
    const { guess } = setup("2000", 0, ' "u9." ');
    expect(await guess()).toBe("U9");
  });

  it.each(["U12", "none", "Ik denk U9", "U9 of U10"])(
    "turns %j (not one allowed age) into null",
    async (reply) => {
      const { guess } = setup("2000", 0, reply);
      expect(await guess()).toBeNull();
    },
  );

  it("sends only the allowed ages and a tiny token ceiling", async () => {
    const { guess, run } = setup("2000", 0, "U9");
    await guess(["U8", "U9"]);
    expect(run).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        max_tokens: 8,
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("U8, U9"),
          }),
        ]),
      }),
    );
  });

  it("counts against the shared daily answer counter", async () => {
    const { guess, store } = setup("2000", 4, "none");
    await guess();
    expect(store.get(`ai:answers:${utcDay()}`)).toBe("5");
  });

  it("at the cap, returns undefined (not asked) and makes no AI call", async () => {
    const { guess, run } = setup("2000", 2000, "U9");
    expect(await guess()).toBeUndefined();
    expect(run).not.toHaveBeenCalled();
  });

  it("on an AI error, returns undefined (not asked)", async () => {
    const { guess, run } = setup("2000", 0);
    run.mockRejectedValueOnce(new Error("workers ai down"));
    expect(await guess()).toBeUndefined();
  });
});
