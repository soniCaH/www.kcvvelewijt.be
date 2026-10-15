/**
 * The worker's front door (#3485): every request except the Sanity webhook
 * must carry `x-kcvv-bff-key` equal to `BFF_SHARED_SECRET`, checked before
 * any service layer is built.
 */
import { timingSafeEqual } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BFF_KEY_HEADER, CLIENT_IP_HEADER } from "@kcvv/api-contract";
import type { WorkerEnv } from "./env";
import { makeTestEnv } from "./test-helpers/env-layer";
import { TEST_SECRET, signPayload } from "./test-helpers/webhook-signing";

// gate-do.ts imports `cloudflare:workers`, which only workerd can load.
vi.mock("./psd/gate-do", () => ({ PsdGate: class {} }));

// Wraps the real web handler in a spy so a test can prove the app was (or
// was never) reached, while the request still runs through real routing.
const handlerSpy = vi.fn<(request: Request) => Promise<Response>>();
vi.mock("@effect/platform", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@effect/platform")>();
  return {
    ...actual,
    HttpApiBuilder: {
      ...actual.HttpApiBuilder,
      toWebHandler: (
        ...args: Parameters<typeof actual.HttpApiBuilder.toWebHandler>
      ) => {
        const built = actual.HttpApiBuilder.toWebHandler(...args);
        handlerSpy.mockImplementation(built.handler);
        return { handler: handlerSpy, dispose: built.dispose };
      },
    },
  };
});

// Lets one test make the webhook handler throw; every other test runs the
// real one.
const webhookOverride = vi.hoisted(() => ({
  fail: undefined as Error | undefined,
}));
vi.mock("./webhooks/index-handler", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./webhooks/index-handler")>();
  return {
    ...actual,
    handleIndexWebhook: (
      ...args: Parameters<typeof actual.handleIndexWebhook>
    ) => {
      if (webhookOverride.fail) throw webhookOverride.fail;
      return actual.handleIndexWebhook(...args);
    },
  };
});

const { default: worker } = await import("./index");

const SECRET = "test-bff-shared-secret";
const ctx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as unknown as ExecutionContext;

const env = (overrides: Partial<WorkerEnv> = {}) =>
  makeTestEnv({
    BFF_SHARED_SECRET: SECRET,
    SANITY_WEBHOOK_SECRET: TEST_SECRET,
    SANITY_DATASET: "production",
    ...overrides,
  });

const get = (path: string, headers: Record<string, string> = {}) =>
  new Request(`https://kcvv-api.workers.dev${path}`, { headers });

beforeEach(() => {
  // Node has no `crypto.subtle.timingSafeEqual` (a Workers extension); the
  // workerd project tests the real one (auth/bff-key.workerd.test.ts).
  Object.defineProperty(crypto.subtle, "timingSafeEqual", {
    configurable: true,
    value: (a: Uint8Array, b: Uint8Array) => timingSafeEqual(a, b),
  });
});

afterEach(() => {
  webhookOverride.fail = undefined;
  handlerSpy.mockReset();
  vi.restoreAllMocks();
});

describe("worker fetch — BFF shared secret", () => {
  it("refuses a request without the header with 401 before any service runs", async () => {
    const res = await worker.fetch(get("/matches/next"), env(), ctx);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
    expect(handlerSpy).not.toHaveBeenCalled();
  });

  it("refuses a wrong header with 401 before any service runs", async () => {
    const res = await worker.fetch(
      get("/matches/next", { [BFF_KEY_HEADER]: "wrong-value" }),
      env(),
      ctx,
    );
    expect(res.status).toBe(401);
    expect(handlerSpy).not.toHaveBeenCalled();
  });

  it("passes a request with the right header to the app unchanged", async () => {
    const request = get("/no-such-route", { [BFF_KEY_HEADER]: SECRET });
    const res = await worker.fetch(request, env(), ctx);
    expect(handlerSpy).toHaveBeenCalledWith(request);
    expect(res.status).toBe(404);
  });

  it("refuses every request and logs an error when BFF_SHARED_SECRET is unset", async () => {
    // Effect's default logger writes every level through `console.log`.
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await worker.fetch(
      get("/matches/next", { [BFF_KEY_HEADER]: "" }),
      env({ BFF_SHARED_SECRET: undefined }),
      ctx,
    );
    expect(res.status).toBe(401);
    expect(handlerSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join(" ")).toContain(
      "[auth] BFF_SHARED_SECRET not set — refusing all requests",
    );
  });

  it("sends no CORS header, even on a preflight", async () => {
    const res = await worker.fetch(
      new Request("https://kcvv-api.workers.dev/search", {
        method: "OPTIONS",
        headers: {
          [BFF_KEY_HEADER]: SECRET,
          origin: "https://evil.example",
          "access-control-request-method": "POST",
        },
      }),
      env(),
      ctx,
    );
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("worker fetch — /webhooks/index is exempt and keeps its HMAC", () => {
  const webhook = (headers: Record<string, string>, body: string) =>
    new Request("https://kcvv-api.workers.dev/webhooks/index", {
      method: "POST",
      headers,
      body,
    });

  it("refuses an unsigned webhook with its own HMAC check", async () => {
    const res = await worker.fetch(
      webhook({ "content-type": "application/json" }, "{}"),
      env(),
      ctx,
    );
    expect(res.status).toBe(401);
    expect(handlerSpy).not.toHaveBeenCalled();
  });

  it("lets a signed webhook past the shared-secret check without the header", async () => {
    const body = JSON.stringify({ _id: "a", _type: "article" });
    const res = await worker.fetch(
      webhook(
        {
          "content-type": "application/json",
          "sanity-webhook-signature": await signPayload(body),
        },
        body,
      ),
      // No SEARCH_INDEX_NAME → the webhook's own dataset guard answers 409,
      // which proves the request got past both the secret and the HMAC.
      env({ BFF_SHARED_SECRET: undefined }),
      ctx,
    );
    expect(res.status).toBe(409);
  });
});

describe("worker fetch — /webhooks/index catch-all (#3477)", () => {
  it("answers internal_error without echoing the exception message", async () => {
    webhookOverride.fail = new Error("secret internal detail");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await worker.fetch(
      new Request("https://kcvv-api.workers.dev/webhooks/index", {
        method: "POST",
        body: "{}",
      }),
      env(),
      ctx,
    );

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ ok: false, code: "internal_error" });
    expect(text).not.toContain("secret internal detail");
  });
});

describe("worker fetch — /related validates its id (#3468)", () => {
  it.each([
    ["a space", "doc%20one"],
    ["a slash", "doc%2Fone"],
    ["129 characters", "a".repeat(129)],
  ])("answers 400 to an id with %s", async (_label, id) => {
    const res = await worker.fetch(
      get(`/related?id=${id}`, { [BFF_KEY_HEADER]: SECRET }),
      env(),
      ctx,
    );
    expect(res.status).toBe(400);
  });
});

describe("worker fetch — /search per-visitor limit (#3468)", () => {
  it("keys the limit on x-kcvv-client-ip and answers 429 with the fixed body", async () => {
    const limit = vi.fn(async () => ({ success: false }));
    const res = await worker.fetch(
      new Request("https://kcvv-api.workers.dev/search", {
        method: "POST",
        headers: {
          [BFF_KEY_HEADER]: SECRET,
          [CLIENT_IP_HEADER]: "198.51.100.4",
          "content-type": "application/json",
        },
        body: JSON.stringify({ query: "kantine" }),
      }),
      env({ SEARCH_IP_LIMITER: { limit } }),
      ctx,
    );
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({
      error: "Too many searches, try again in a minute",
    });
    expect(limit).toHaveBeenCalledWith({ key: "ip:198.51.100.4" });
  });
});
