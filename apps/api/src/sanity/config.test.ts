import { Effect, Redacted } from "effect";
import { describe, expect, it } from "vitest";
import { workerConfigProvider } from "../config";
import { makeTestEnv } from "../test-helpers/env-layer";
import { sanityClientConfig } from "./config";

const read = (vars = {}) =>
  Effect.runPromise(
    sanityClientConfig.pipe(
      Effect.withConfigProvider(workerConfigProvider(makeTestEnv(vars))),
    ),
  );

describe("sanityClientConfig", () => {
  it("pins every BFF client to the published perspective (#3477)", async () => {
    expect((await read()).perspective).toBe("published");
  });

  it("hands the client the token itself, not its redacted wrapper", async () => {
    const { token } = await read({ SANITY_API_TOKEN: "t0ken" });
    expect(token).toBe("t0ken");
    expect(Redacted.isRedacted(token)).toBe(false);
  });
});
