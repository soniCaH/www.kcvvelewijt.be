import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Cause, Effect, Exit } from "effect";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { SanityReadError } from "@/lib/sanity/fetch-groq";
import { orDieOrRenderOnDemand } from "./or-die-or-render-on-demand";

const { DYNAMIC_BAILOUT, connection } = vi.hoisted(() => {
  const DYNAMIC_BAILOUT = new Error("connection() bailout");
  return {
    DYNAMIC_BAILOUT,
    connection: vi.fn(async () => {
      throw DYNAMIC_BAILOUT;
    }),
  };
});
vi.mock("next/server", () => ({ connection }));

const readFailed = new SanityReadError({ cause: new Error("HTTP 503") });

async function defectOf(effect: Effect.Effect<unknown>) {
  const exit = await Effect.runPromiseExit(effect);
  if (Exit.isSuccess(exit)) throw new Error("expected a defect");
  return Cause.squash(exit.cause);
}

describe("orDieOrRenderOnDemand", () => {
  beforeEach(() => {
    connection.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("passes a successful read through", async () => {
    vi.stubEnv("NEXT_PHASE", PHASE_PRODUCTION_BUILD);
    const result = await Effect.runPromise(
      orDieOrRenderOnDemand(Effect.succeed("sponsors")),
    );
    expect(result).toBe("sponsors");
    expect(connection).not.toHaveBeenCalled();
  });

  it("dies with the read error outside the build, same as `Effect.orDie`", async () => {
    vi.stubEnv("NEXT_PHASE", "");
    expect(await defectOf(orDieOrRenderOnDemand(Effect.fail(readFailed)))).toBe(
      readFailed,
    );
    expect(connection).not.toHaveBeenCalled();
  });

  it("bails the page to on-demand rendering on a failed read during the build", async () => {
    vi.stubEnv("NEXT_PHASE", PHASE_PRODUCTION_BUILD);
    expect(await defectOf(orDieOrRenderOnDemand(Effect.fail(readFailed)))).toBe(
      DYNAMIC_BAILOUT,
    );
    expect(connection).toHaveBeenCalledOnce();
  });

  it("still dies on a code defect during the build — the build keeps gating", async () => {
    vi.stubEnv("NEXT_PHASE", PHASE_PRODUCTION_BUILD);
    const bug = new TypeError("x is undefined");
    expect(await defectOf(orDieOrRenderOnDemand(Effect.die(bug)))).toBe(bug);
    expect(connection).not.toHaveBeenCalled();
  });
});
