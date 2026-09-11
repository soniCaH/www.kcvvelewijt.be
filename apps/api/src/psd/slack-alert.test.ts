import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildIncidentMessage,
  buildDriftMessage,
  buildJobAlertMessage,
  formatDuration,
  postSlack,
} from "./slack-alert";

describe("formatDuration", () => {
  it("formats coarse durations and clamps negatives to 0s", () => {
    expect(formatDuration(30_000)).toBe("30s");
    expect(formatDuration(90_000)).toBe("1m");
    expect(formatDuration(3 * 3600_000 + 12 * 60_000)).toBe("3h 12m");
    expect(formatDuration(2 * 86400_000 + 5 * 3600_000)).toBe("2d 5h");
    expect(formatDuration(-1000)).toBe("0s");
  });
});

describe("buildIncidentMessage", () => {
  it("names the key, status, and error on outage-start", () => {
    const msg = buildIncidentMessage(
      { kind: "outage-start", startedAt: 0 },
      { key: "matches:team:42", status: 429, error: "HTTP 429: Too Many" },
    );
    expect(msg).toContain("outage started");
    expect(msg).toContain("matches:team:42");
    expect(msg).toContain("429");
    expect(msg).toContain("Too Many");
  });

  it("reports incident duration on recovery", () => {
    const msg = buildIncidentMessage(
      {
        kind: "recovery",
        startedAt: 0,
        recoveredAt: 3_600_000,
        durationMs: 3_600_000,
      },
      { key: "ranking:1" },
    );
    expect(msg).toContain("recovered");
    expect(msg).toContain("ranking:1");
    expect(msg).toContain("1h 0m");
  });
});

describe("buildDriftMessage", () => {
  it("names the key, stale age, and time to the hard-expiry cliff", () => {
    const day = 86400_000;
    const msg = buildDriftMessage({
      key: "matches:team:42",
      staleAgeMs: 2 * day, // 2 days stale
      hardTtlMs: 7 * day, // 7-day cliff
      status: 429,
    });
    expect(msg).toContain("matches:team:42");
    expect(msg).toContain("2d 0h"); // stale age
    expect(msg).toContain("5d 0h"); // time to cliff (7 - 2)
    expect(msg).toContain("429");
  });

  it("clamps time-to-cliff to 0 when already past the cliff", () => {
    const day = 86400_000;
    const msg = buildDriftMessage({
      key: "k",
      staleAgeMs: 8 * day,
      hardTtlMs: 7 * day,
    });
    expect(msg).toContain("0s until");
  });
});

describe("buildJobAlertMessage", () => {
  it("names the job, failure count, and error on a job-failure alert", () => {
    const msg = buildJobAlertMessage(
      { kind: "job-failure" },
      {
        job: "psd-sanity-sync",
        consecutiveFailures: 1,
        error: "PSD 429: Too Many Requests",
      },
    );
    expect(msg).toContain("psd-sanity-sync");
    expect(msg).toContain("1 consecutive run");
    expect(msg).toContain("PSD 429: Too Many Requests");
  });

  it("pluralises the run count on a job-failure alert", () => {
    const msg = buildJobAlertMessage(
      { kind: "job-failure" },
      { job: "sanity-index-sync", consecutiveFailures: 3, error: "boom" },
    );
    expect(msg).toContain("3 consecutive runs");
  });

  it("names the job and the failed-run count on a job-recovery alert", () => {
    const msg = buildJobAlertMessage(
      { kind: "job-recovery" },
      { job: "psd-sanity-sync", consecutiveFailures: 3 },
    );
    expect(msg).toContain("recovered");
    expect(msg).toContain("psd-sanity-sync");
    expect(msg).toContain("3 failed runs");
  });
});

describe("postSlack", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("no-ops (no fetch) and resolves false when the webhook URL is absent", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(postSlack(undefined, "hi")).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs a JSON {text} body to the webhook and resolves true on a confirmed (ok) response", async () => {
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      postSlack("https://hooks.slack.test/abc", "hello"),
    ).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://hooks.slack.test/abc",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "hello" }),
      }),
    );
  });

  it("resolves false (never throws) and logs on a non-ok response", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    await expect(postSlack("https://hooks.slack.test/abc", "x")).resolves.toBe(
      false,
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("swallows fetch errors (best-effort) and resolves false", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await expect(postSlack("https://hooks.slack.test/abc", "x")).resolves.toBe(
      false,
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
