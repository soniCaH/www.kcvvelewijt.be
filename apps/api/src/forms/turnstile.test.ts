import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect, Logger } from "effect";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import type { WorkerEnv } from "../env";
import { verifyTurnstile } from "./turnstile";

type Level = "Error" | "Warning";

function run(env: Partial<WorkerEnv>) {
  const logs: { level: string; message: string }[] = [];
  const logger = Logger.replace(
    Logger.defaultLogger,
    Logger.make(({ logLevel, message }) => {
      logs.push({ level: logLevel._tag, message: String(message) });
    }),
  );
  const result = Effect.runPromise(
    verifyTurnstile("tok").pipe(
      Effect.provide(makeTestEnvLayer(env)),
      Effect.provide(logger),
    ),
  );
  const logged = (level: Level) => logs.filter((l) => l.level === level);
  return { result, logged };
}

const withSecret = { TURNSTILE_SECRET: "s3cret" };

describe("verifyTurnstile (#3464)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fails closed and logs an error when the secret is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result, logged } = run({});

    expect(await result).toBe(false);
    expect(logged("Error")).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("only the exact string 'true' enables the dev flag", async () => {
    const { result } = run({ ALLOW_MISSING_FORM_SECRETS: "1" });
    expect(await result).toBe(false);
  });

  it("skips with a warning when the secret is missing and the dev flag is on", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result, logged } = run({ ALLOW_MISSING_FORM_SECRETS: "true" });

    expect(await result).toBe(true);
    expect(logged("Warning")).toHaveLength(1);
    expect(logged("Error")).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes on siteverify success: true", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ success: true }, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result, logged } = run(withSecret);

    expect(await result).toBe(true);
    expect(logged("Error")).toHaveLength(0);
    const init = (
      fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    )[1];
    expect(JSON.parse(init.body as string)).toEqual({
      secret: "s3cret",
      response: "tok",
    });
  });

  it("rejects on siteverify success: false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ success: false })),
    );
    expect(await run(withSecret).result).toBe(false);
  });

  it("fails closed and logs an error on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ success: true }, { status: 503 })),
    );
    const { result, logged } = run(withSecret);

    expect(await result).toBe(false);
    expect(logged("Error")).toHaveLength(1);
  });

  it("fails closed and logs an error on a non-JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>oops</html>", { status: 200 })),
    );
    const { result, logged } = run(withSecret);

    expect(await result).toBe(false);
    expect(logged("Error")).toHaveLength(1);
  });

  it("fails closed and logs an error on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    const { result, logged } = run(withSecret);

    expect(await result).toBe(false);
    expect(logged("Error")).toHaveLength(1);
  });

  it("fails closed and logs an error on a timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("signal timed out", "TimeoutError");
      }),
    );
    const { result, logged } = run(withSecret);

    expect(await result).toBe(false);
    expect(logged("Error")).toHaveLength(1);
  });
});
