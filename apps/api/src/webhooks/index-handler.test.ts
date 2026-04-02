import { beforeEach, describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import { handleIndexWebhook, type WebhookLayer } from "./index-handler";
import type { WorkerEnv } from "../env";
import { TEST_SECRET, signPayload } from "../test-helpers/svix-signing";
import { EmbeddingService } from "../search/embedding";
import { VectorizeService } from "../search/vectorize";
import { WebhookSanityClient } from "./sanity-client";

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
    AI: {} as Ai,
    SEARCH_INDEX: {} as VectorizeIndex,
    ...overrides,
  };
}

// ─── Test layer factories ──────────────────────────────────────────────────

const upsertSpy = vi.fn<(vectors: unknown[]) => void>();
const deleteByIdsSpy = vi.fn<(ids: string[]) => void>();

function makeTestLayer(
  fetchDocument: (
    id: string,
    query: string,
  ) => Effect.Effect<Record<string, unknown> | null>,
): WebhookLayer {
  return Layer.mergeAll(
    Layer.succeed(WebhookSanityClient, {
      fetchDocument,
    }),
    Layer.succeed(EmbeddingService, {
      embed: () => Effect.succeed(FAKE_VECTOR),
    }),
    Layer.succeed(VectorizeService, {
      upsert: (vectors) =>
        Effect.sync(() => {
          upsertSpy(vectors);
        }),
      deleteByIds: (ids) =>
        Effect.sync(() => {
          deleteByIdsSpy(ids);
        }),
      query: () => Effect.succeed([]),
      getByIds: () => Effect.succeed([]),
    }),
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("handleIndexWebhook", () => {
  beforeEach(() => {
    upsertSpy.mockClear();
    deleteByIdsSpy.mockClear();
  });

  const defaultLayer = makeTestLayer(() => Effect.succeed(null));

  it("returns 401 for missing SVIX headers", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "responsibility" });
    const request = await makeSignedRequest(body, { missingHeaders: true });

    const response = await handleIndexWebhook(request, makeEnv(), defaultLayer);
    expect(response.status).toBe(401);
  });

  it("returns 401 for invalid signature", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "responsibility" });
    const request = await makeSignedRequest(body, { invalidSig: true });

    const response = await handleIndexWebhook(request, makeEnv(), defaultLayer);
    expect(response.status).toBe(401);
  });

  it("returns 401 for replayed requests (timestamp > 5 min old)", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "responsibility" });
    const request = await makeSignedRequest(body, { oldTimestamp: true });

    const response = await handleIndexWebhook(request, makeEnv(), defaultLayer);
    expect(response.status).toBe(401);
  });

  it("deletes vector on delete operation", async () => {
    const body = JSON.stringify({
      _id: "doc-to-delete",
      _type: "responsibility",
    });
    const request = await makeSignedRequest(body, { operation: "delete" });

    const response = await handleIndexWebhook(request, makeEnv(), defaultLayer);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ ok: true, action: "deleted" });
    expect(deleteByIdsSpy).toHaveBeenCalledWith(["doc-to-delete"]);
  });

  it("returns 200 with skipped_unknown_type for unknown document type", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "unknownType" });
    const request = await makeSignedRequest(body);

    const response = await handleIndexWebhook(request, makeEnv(), defaultLayer);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ ok: true, action: "skipped_unknown_type" });
  });

  it("indexes a published responsibility", async () => {
    const sanityDoc = {
      _id: "resp-123",
      slug: "kantine",
      title: "Kantine",
      question: "Wie regelt de kantine?",
      keywords: ["kantine", "bar"],
      summary: "De kantine wordt beheerd door de evenementencommissie.",
      category: "algemeen",
    };

    const layer = makeTestLayer(() => Effect.succeed(sanityDoc));

    const body = JSON.stringify({
      _id: "resp-123",
      _type: "responsibility",
    });
    const request = await makeSignedRequest(body);

    const response = await handleIndexWebhook(request, makeEnv(), layer);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ ok: true, action: "indexed" });

    expect(upsertSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "resp-123",
        values: FAKE_VECTOR,
        metadata: expect.objectContaining({
          slug: "kantine",
          type: "responsibility",
          title: "Kantine",
        }),
      }),
    ]);
  });

  it("returns skipped_not_found when document is not in Sanity", async () => {
    const body = JSON.stringify({
      _id: "deleted-doc",
      _type: "responsibility",
    });
    const request = await makeSignedRequest(body);

    const layer = makeTestLayer(() => Effect.succeed(null));

    const response = await handleIndexWebhook(request, makeEnv(), layer);

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

    const layer = makeTestLayer(() => Effect.succeed(articleDoc));

    const body = JSON.stringify({ _id: "article-001", _type: "article" });
    const request = await makeSignedRequest(body);

    const response = await handleIndexWebhook(request, makeEnv(), layer);

    expect(response.status).toBe(200);
    expect(upsertSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "article-001",
        metadata: expect.objectContaining({
          type: "article",
          slug: "kcvv-wint",
        }),
      }),
    ]);
  });

  it("stores imageUrl in article metadata when present", async () => {
    const articleDoc = {
      _id: "article-001",
      slug: "kcvv-wint",
      title: "KCVV wint!",
      tags: ["verslag"],
      bodyText: "KCVV won met 3-1.",
      imageUrl: "https://cdn.example.com/cover.jpg",
    };

    const layer = makeTestLayer(() => Effect.succeed(articleDoc));

    const body = JSON.stringify({ _id: "article-001", _type: "article" });
    const request = await makeSignedRequest(body);

    await handleIndexWebhook(request, makeEnv(), layer);

    expect(upsertSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        metadata: expect.objectContaining({
          imageUrl: "https://cdn.example.com/cover.jpg",
        }),
      }),
    ]);
  });

  it("omits imageUrl from article metadata when absent", async () => {
    const articleDoc = {
      _id: "article-001",
      slug: "kcvv-wint",
      title: "KCVV wint!",
      tags: ["verslag"],
      bodyText: "KCVV won met 3-1.",
    };

    const layer = makeTestLayer(() => Effect.succeed(articleDoc));

    const body = JSON.stringify({ _id: "article-001", _type: "article" });
    const request = await makeSignedRequest(body);

    await handleIndexWebhook(request, makeEnv(), layer);

    const call = upsertSpy.mock.calls[0]?.[0]?.[0] as {
      metadata: Record<string, string>;
    };
    expect(call?.metadata).not.toHaveProperty("imageUrl");
  });

  it("indexes a page with correct metadata", async () => {
    const pageDoc = {
      _id: "page-001",
      slug: "over-kcvv",
      title: "Over KCVV",
      bodyText: "KCVV Elewijt is een voetbalclub.",
    };

    const layer = makeTestLayer(() => Effect.succeed(pageDoc));

    const body = JSON.stringify({ _id: "page-001", _type: "page" });
    const request = await makeSignedRequest(body);

    const response = await handleIndexWebhook(request, makeEnv(), layer);

    expect(response.status).toBe(200);
    expect(upsertSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "page-001",
        metadata: expect.objectContaining({
          type: "page",
          slug: "over-kcvv",
        }),
      }),
    ]);
  });

  it("returns 400 for payload missing _id (schema validation)", async () => {
    const body = JSON.stringify({ _type: "article" });
    const request = await makeSignedRequest(body);

    const response = await handleIndexWebhook(request, makeEnv(), defaultLayer);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toMatchObject({ ok: false, code: "parse_failed" });
  });

  it("returns 400 for payload missing _type (schema validation)", async () => {
    const body = JSON.stringify({ _id: "doc-1" });
    const request = await makeSignedRequest(body);

    const response = await handleIndexWebhook(request, makeEnv(), defaultLayer);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toMatchObject({ ok: false, code: "parse_failed" });
  });

  it("returns 400 for malformed JSON body", async () => {
    const body = "not valid json{{{";
    const request = await makeSignedRequest(body);

    const response = await handleIndexWebhook(request, makeEnv(), defaultLayer);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toMatchObject({ ok: false, code: "parse_failed" });
  });
});
