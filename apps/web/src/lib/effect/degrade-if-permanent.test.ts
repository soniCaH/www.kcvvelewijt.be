import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect } from "effect";
import { degradeIfPermanent } from "./degrade-if-permanent";
import { makeTaggedBffError } from "./bff-error.fixtures";
import type { BffError } from "@/lib/effect/services/BffService";

const failingEffect = (
  tag: BffError["_tag"],
): Effect.Effect<never, BffError> => {
  return Effect.fail(makeTaggedBffError(tag)) as unknown as Effect.Effect<
    never,
    BffError
  >;
};

describe("degradeIfPermanent", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each<BffError["_tag"]>([
    "HttpNotFound",
    "ParseError",
    "HttpApiDecodeError",
  ])(
    "resolves %s to the permanent fallback instead of rejecting",
    async (tag) => {
      const result = await Effect.runPromise(
        degradeIfPermanent(failingEffect(tag), "fallback" as const),
      );
      expect(result).toBe("fallback");
    },
  );

  it("warns when it classifies a permanent failure, naming the tag", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await Effect.runPromise(
      degradeIfPermanent(failingEffect("HttpNotFound"), "fallback" as const),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("HttpNotFound"),
      expect.objectContaining({ error: expect.anything() }),
    );
  });

  it.each<BffError["_tag"]>([
    "HttpServiceUnavailable",
    "HttpBadGateway",
    "TimeoutException",
    "RequestError",
    "ResponseError",
  ])("leaves %s rejecting unchanged (transient)", async (tag) => {
    await expect(
      Effect.runPromise(
        degradeIfPermanent(failingEffect(tag), "fallback" as const),
      ),
    ).rejects.toBeTruthy();
  });

  it("passes a successful value through untouched", async () => {
    const result = await Effect.runPromise(
      degradeIfPermanent(Effect.succeed(42), "fallback" as const),
    );
    expect(result).toBe(42);
  });
});
