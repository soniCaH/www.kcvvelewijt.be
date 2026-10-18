/**
 * `scheduled()` dispatch for the weekly staff-gaps nudge (#3561): its own
 * cron, its own job name in the job-alert state, never the nightly sync.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeTestEnv } from "./test-helpers/env-layer";

// gate-do.ts imports `cloudflare:workers`, which only workerd can load.
vi.mock("./psd/gate-do", () => ({ PsdGate: class {} }));

const sanityFetch = vi.fn();
vi.mock("@sanity/client", () => ({
  createClient: () => ({ fetch: sanityFetch }),
}));

const { default: worker } = await import("./index");

const WEBHOOK = "https://hooks.slack.test/abc";
const ctx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as unknown as ExecutionContext;
const kvKeys: string[] = [];
const kv = {
  get: async (key: string) => {
    kvKeys.push(key);
    return null;
  },
  put: async () => {},
  delete: async () => {},
} as unknown as KVNamespace;
const weekly = { cron: "0 6 * * 1" } as ScheduledEvent;

afterEach(() => {
  sanityFetch.mockReset();
  kvKeys.length = 0;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("scheduled() — weekly staff-gaps check", () => {
  it("runs the check and skips Slack when there is nothing to report", async () => {
    sanityFetch.mockResolvedValueOnce({
      emptyRoles: [],
      noPhoto: [],
      coordinators: [],
    });
    const slack = vi.fn();
    vi.stubGlobal("fetch", slack);

    await worker.scheduled(
      weekly,
      makeTestEnv({ PSD_CACHE: kv, SLACK_ALERT_WEBHOOK_URL: WEBHOOK }),
      ctx,
    );

    expect(sanityFetch).toHaveBeenCalledTimes(1);
    expect(slack).not.toHaveBeenCalled();
    expect(kvKeys).toContain("job-alert:staff-gaps-check");
  });

  it("posts the nudge when there are gaps", async () => {
    sanityFetch.mockResolvedValueOnce({
      emptyRoles: [],
      noPhoto: [{ id: "s1", firstName: "An", lastName: "Smet" }],
      coordinators: [],
    });
    const slack = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", slack);

    await worker.scheduled(
      weekly,
      makeTestEnv({ PSD_CACHE: kv, SLACK_ALERT_WEBHOOK_URL: WEBHOOK }),
      ctx,
    );

    expect(slack).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(slack.mock.calls[0])).toContain("An Smet");
  });

  it("reports a failed read under its own job name and rethrows", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sanityFetch.mockRejectedValueOnce(new Error("sanity down"));
    const slack = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", slack);

    await expect(
      worker.scheduled(
        weekly,
        makeTestEnv({ PSD_CACHE: kv, SLACK_ALERT_WEBHOOK_URL: WEBHOOK }),
        ctx,
      ),
    ).rejects.toThrow();

    expect(kvKeys).toEqual(["job-alert:staff-gaps-check"]);
    expect(JSON.stringify(slack.mock.calls[0])).toContain("staff-gaps-check");
  });
});
