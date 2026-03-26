import { describe, it, expect, vi } from "vitest";
import { handleIndexWebhook } from "./index-handler";
import type { WorkerEnv } from "../env";
import { TEST_SECRET, signPayload } from "../test-helpers/svix-signing";

const FAKE_VECTOR = Array(1024).fill(0.1);

// ─── Helpers ────────────────────────────────────────────────────────────────

async function makeSignedRequest(
  body: string,
  options: {
    operation?: string;
    invalidSig?: boolean;
    oldTimestamp?: boolean;
    missingHeaders?: boolean;
  } = {},
): Promise<Request> {
  const svixId = "msg_test123";
  const timestamp = options.oldTimestamp
    ? Math.floor(Date.now() / 1000) - 301
    : Math.floor(Date.now() / 1000);

  const signature = options.invalidSig
    ? "v1,invalidsignature=="
    : await signPayload(svixId, timestamp, body);

  const headers: Record<string, string> = options.missingHeaders
    ? {}
    : {
        "svix-id": svixId,
        "svix-timestamp": String(timestamp),
        "svix-signature": signature,
        "content-type": "application/json",
      };

  if (options.operation) {
    headers["sanity-operation"] = options.operation;
  }

  return new Request("https://kcvv-api.workers.dev/webhooks/index", {
    method: "POST",
    headers,
    body,
  });
}

function makeEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    PSD_API_BASE_URL: "",
    PSD_IMAGE_BASE_URL: "",
    FOOTBALISTO_LOGO_CDN_URL: "",
    PSD_API_KEY: "",
    PSD_API_CLUB: "",
    PSD_API_AUTH: "",
    PSD_CACHE: {} as KVNamespace,
    SANITY_PROJECT_ID: "test",
    SANITY_DATASET: "test",
    SANITY_API_TOKEN: "test-token",
    SANITY_WEBHOOK_SECRET: TEST_SECRET,
    AI: {
      run: vi.fn(async () => ({ data: [FAKE_VECTOR] })),
    } as unknown as Ai,
    SEARCH_INDEX: {
      upsert: vi.fn(async () => ({ mutationId: "m1", count: 1 })),
      deleteByIds: vi.fn(async () => ({ mutationId: "m2", count: 1 })),
    } as unknown as VectorizeIndex,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("handleIndexWebhook", () => {
  it("returns 401 for missing SVIX headers", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "responsibilityPath" });
    const request = await makeSignedRequest(body, { missingHeaders: true });
    const env = makeEnv();

    const response = await handleIndexWebhook(request, env);
    expect(response.status).toBe(401);
  });

  it("returns 401 for invalid signature", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "responsibilityPath" });
    const request = await makeSignedRequest(body, { invalidSig: true });
    const env = makeEnv();

    const response = await handleIndexWebhook(request, env);
    expect(response.status).toBe(401);
  });

  it("returns 401 for replayed requests (timestamp > 5 min old)", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "responsibilityPath" });
    const request = await makeSignedRequest(body, { oldTimestamp: true });
    const env = makeEnv();

    const response = await handleIndexWebhook(request, env);
    expect(response.status).toBe(401);
  });

  it("deletes vector on delete operation", async () => {
    const body = JSON.stringify({
      _id: "doc-to-delete",
      _type: "responsibilityPath",
    });
    const request = await makeSignedRequest(body, { operation: "delete" });
    const env = makeEnv();

    const response = await handleIndexWebhook(request, env);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ ok: true, action: "deleted" });
    expect(env.SEARCH_INDEX.deleteByIds).toHaveBeenCalledWith([
      "doc-to-delete",
    ]);
  });

  it("returns 200 with skipped_unknown_type for unknown document type", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "unknownType" });
    const request = await makeSignedRequest(body);
    const env = makeEnv();

    const response = await handleIndexWebhook(request, env);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ ok: true, action: "skipped_unknown_type" });
  });

  it("indexes a published responsibilityPath", async () => {
    const sanityDoc = {
      _id: "resp-123",
      slug: "kantine",
      title: "Kantine",
      question: "Wie regelt de kantine?",
      keywords: ["kantine", "bar"],
      summary: "De kantine wordt beheerd door de evenementencommissie.",
      category: "algemeen",
    };

    const body = JSON.stringify({
      _id: "resp-123",
      _type: "responsibilityPath",
    });
    const request = await makeSignedRequest(body);
    const env = makeEnv();

    const response = await handleIndexWebhook(request, env, {
      fetchDocument: async () => sanityDoc,
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ ok: true, action: "indexed" });

    expect(env.SEARCH_INDEX.upsert).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "resp-123",
        values: FAKE_VECTOR,
        metadata: expect.objectContaining({
          slug: "kantine",
          type: "responsibilityPath",
          title: "Kantine",
        }),
      }),
    ]);
  });

  it("returns skipped_not_found when document is not in Sanity", async () => {
    const body = JSON.stringify({
      _id: "deleted-doc",
      _type: "responsibilityPath",
    });
    const request = await makeSignedRequest(body);
    const env = makeEnv();

    const response = await handleIndexWebhook(request, env, {
      fetchDocument: async () => null,
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ ok: true, action: "skipped_not_found" });
  });

  it("indexes an article with correct metadata", async () => {
    const articleDoc = {
      _id: "article-001",
      slug: "kcvv-wint",
      title: "KCVV wint!",
      tags: ["verslag"],
      bodyText: "KCVV won met 3-1.",
    };

    const body = JSON.stringify({ _id: "article-001", _type: "article" });
    const request = await makeSignedRequest(body);
    const env = makeEnv();

    const response = await handleIndexWebhook(request, env, {
      fetchDocument: async () => articleDoc,
    });

    expect(response.status).toBe(200);
    expect(env.SEARCH_INDEX.upsert).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "article-001",
        metadata: expect.objectContaining({
          type: "article",
          slug: "kcvv-wint",
        }),
      }),
    ]);
  });

  it("indexes a page with correct metadata", async () => {
    const pageDoc = {
      _id: "page-001",
      slug: "over-kcvv",
      title: "Over KCVV",
      bodyText: "KCVV Elewijt is een voetbalclub.",
    };

    const body = JSON.stringify({ _id: "page-001", _type: "page" });
    const request = await makeSignedRequest(body);
    const env = makeEnv();

    const response = await handleIndexWebhook(request, env, {
      fetchDocument: async () => pageDoc,
    });

    expect(response.status).toBe(200);
    expect(env.SEARCH_INDEX.upsert).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "page-001",
        metadata: expect.objectContaining({
          type: "page",
          slug: "over-kcvv",
        }),
      }),
    ]);
  });
});
