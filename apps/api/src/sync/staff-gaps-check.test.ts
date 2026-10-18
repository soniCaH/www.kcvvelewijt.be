import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect, Layer } from "effect";
import { SanityProjection, type StaffGaps } from "../sanity/projection";
import { makeSanityProjectionStub } from "../test-helpers/sanity-projection-stub";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import { runStaffGapsCheck } from "./staff-gaps-check";

const WEBHOOK = "https://hooks.slack.test/abc";
const NONE: StaffGaps = { emptyRoles: [], noPhoto: [], coordinators: [] };

const run = (
  gaps: StaffGaps,
  { webhook }: { webhook?: string } = { webhook: WEBHOOK },
) => {
  const getStaffGaps = vi.fn(() => Effect.succeed(gaps));
  const promise = Effect.runPromise(
    Effect.either(
      runStaffGapsCheck.pipe(
        Effect.provide(
          Layer.merge(
            Layer.succeed(
              SanityProjection,
              makeSanityProjectionStub({ getStaffGaps }),
            ),
            makeTestEnvLayer({ SLACK_ALERT_WEBHOOK_URL: webhook }),
          ),
        ),
      ),
    ),
  );
  return { promise, getStaffGaps };
};

afterEach(() => vi.unstubAllGlobals());

describe("runStaffGapsCheck", () => {
  it("posts the message to Slack when there are gaps", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { promise } = run({
      ...NONE,
      noPhoto: [{ id: "s1", name: "An Smet" }],
    });
    expect((await promise)._tag).toBe("Right");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(WEBHOOK);
    expect(String(init.body)).toContain("An Smet");
  });

  it("skips Slack when there is nothing to report", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { promise, getStaffGaps } = run(NONE);
    expect((await promise)._tag).toBe("Right");
    expect(getStaffGaps).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is a no-op without SLACK_ALERT_WEBHOOK_URL (staging) — not even the read", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { promise, getStaffGaps } = run(
      { ...NONE, noPhoto: [{ id: "s1", name: "X" }] },
      {},
    );
    expect((await promise)._tag).toBe("Right");
    expect(getStaffGaps).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails when Slack does not confirm delivery, so the job reports a failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 500 })),
    );
    const { promise } = run({ ...NONE, noPhoto: [{ id: "s1", name: "X" }] });
    expect((await promise)._tag).toBe("Left");
  });
});
