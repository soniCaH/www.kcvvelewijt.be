/**
 * `scheduled()` dispatch for the weekly staff-gaps nudge (#3561): its own
 * cron, its own job name in the job-alert state, never the nightly sync.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeTestEnv } from "./test-helpers/env-layer";
import { BIRTHDAY_CRON } from "./sync/birthday-post";
import { STAFF_GAPS_CRON } from "./sync/staff-gaps-check";

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
const weekly = { cron: STAFF_GAPS_CRON } as ScheduledEvent;

afterEach(() => {
  sanityFetch.mockReset();
  kvKeys.length = 0;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("scheduled() — weekly staff-gaps check", () => {
  it("wrangler.toml schedules the exact cron string the handler matches", () => {
    // Cloudflare numbers weekdays 1 = Sunday, so the cron names its day.
    const toml = readFileSync(join(__dirname, "../wrangler.toml"), "utf8");
    expect(toml).toContain(`"${STAFF_GAPS_CRON}"`);
  });

  it("runs the check and skips Slack when there is nothing to report", async () => {
    sanityFetch.mockResolvedValueOnce({
      emptyRoles: [],
      noPhoto: [],
      coordinators: [],
      missingRoleCodes: [],
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
      missingRoleCodes: [],
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

describe("scheduled() — daily birthday post (#3570)", () => {
  const daily = {
    cron: BIRTHDAY_CRON,
    scheduledTime: Date.parse("2026-10-22T07:00:00Z"),
  } as ScheduledEvent;

  it("wrangler.toml schedules the exact cron string the handler matches", () => {
    const toml = readFileSync(join(__dirname, "../wrangler.toml"), "utf8");
    expect(toml).toContain(`"${BIRTHDAY_CRON}"`);
  });

  it("posts today's birthdays under its own job name", async () => {
    sanityFetch.mockResolvedValueOnce([
      {
        firstName: "An",
        lastName: "Smet",
        birthDate: "2012-10-22",
        team: "U15",
        role: null,
      },
    ]);
    const slack = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", slack);

    await worker.scheduled(
      daily,
      makeTestEnv({ PSD_CACHE: kv, SLACK_BIRTHDAY_WEBHOOK_URL: WEBHOOK }),
      ctx,
    );

    expect(sanityFetch).toHaveBeenCalledTimes(1);
    expect(slack).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(slack.mock.calls[0])).toContain("An Smet");
    expect(kvKeys).toContain("job-alert:birthday-post");
  });
});
