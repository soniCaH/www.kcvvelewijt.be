import { createClient } from "@sanity/client";
import { Effect, Schema as S } from "effect";
import type { WorkerEnv } from "../env";
import {
  buildArticleIndexText,
  buildPageIndexText,
  buildResponsibilityIndexText,
} from "../search/index-text";
import { WebhookPayload } from "./schemas";
import { verifySvixSignature } from "./svix-verify";

// ─── Error types ───────────────────────────────────────────────────────────

class WebhookParseError {
  readonly _tag = "WebhookParseError";
  constructor(
    readonly code: "invalid_json" | "invalid_shape",
    readonly detail: string,
  ) {}
}

class WebhookAuthError {
  readonly _tag = "WebhookAuthError";
}

class WebhookServiceError {
  readonly _tag = "WebhookServiceError";
  constructor(
    readonly code:
      | "sanity_fetch_failed"
      | "embedding_failed"
      | "upsert_failed"
      | "delete_failed"
      | "invalid_document",
    readonly detail: string,
  ) {}
}

// ─── Handler options ───────────────────────────────────────────────────────

interface HandlerOptions {
  fetchDocument?: (id: string) => Promise<Record<string, unknown> | null>;
}

// ─── Pure helpers ──────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["responsibility", "article", "page"] as const;
const ALLOWED_OPS = ["create", "update", "delete"] as const;

type AllowedType = (typeof ALLOWED_TYPES)[number];
type AllowedOp = (typeof ALLOWED_OPS)[number];

const isAllowedType = (value: string): value is AllowedType =>
  (ALLOWED_TYPES as readonly string[]).includes(value);

const isAllowedOp = (value: string): value is AllowedOp =>
  (ALLOWED_OPS as readonly string[]).includes(value);

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

const ResponsibilityDoc = S.Struct({
  title: S.String,
  question: S.String,
  keywords: S.Array(S.String),
  summary: S.String,
  slug: S.String,
  category: S.String,
});

const ArticleDoc = S.Struct({
  title: S.String,
  tags: S.Array(S.String),
  bodyText: S.NullOr(S.String),
  slug: S.String,
  imageUrl: S.optional(S.NullOr(S.String)),
});

const PageDoc = S.Struct({
  title: S.String,
  bodyText: S.NullOr(S.String),
  slug: S.String,
});

function buildDocumentIndex(
  _type: AllowedType,
  doc: Record<string, unknown>,
): { indexText: string; metadata: Record<string, string> } {
  if (_type === "responsibility") {
    const result = S.decodeUnknownSync(ResponsibilityDoc)(doc);
    return {
      indexText: buildResponsibilityIndexText(result),
      metadata: {
        slug: result.slug,
        type: "responsibility",
        title: result.title,
        excerpt: result.summary.slice(0, 200),
      },
    };
  } else if (_type === "article") {
    const result = S.decodeUnknownSync(ArticleDoc)(doc);
    return {
      indexText: buildArticleIndexText(result),
      metadata: {
        slug: result.slug,
        type: "article",
        title: result.title,
        excerpt: (result.bodyText ?? "").slice(0, 200),
        ...(result.imageUrl ? { imageUrl: result.imageUrl } : {}),
      },
    };
  } else {
    const result = S.decodeUnknownSync(PageDoc)(doc);
    return {
      indexText: buildPageIndexText(result),
      metadata: {
        slug: result.slug,
        type: "page",
        title: result.title,
        excerpt: (result.bodyText ?? "").slice(0, 200),
      },
    };
  }
}

function queryForType(type: AllowedType): string {
  switch (type) {
    case "responsibility":
      return `*[_id == $id][0]{ _id, "slug": coalesce(slug.current,""), title, question, "keywords": coalesce(keywords,[]), "summary": coalesce(summary,""), category }`;
    case "article":
      return `*[_id == $id][0]{ _id, "slug": coalesce(slug.current,""), title, "tags": coalesce(tags,[]), "bodyText": pt::text(body), "imageUrl": coverImage.asset->url }`;
    case "page":
      return `*[_id == $id][0]{ _id, "slug": coalesce(slug.current,""), title, "bodyText": pt::text(body) }`;
  }
}

// ─── Error → Response mapping ──────────────────────────────────────────────

const toErrorResponse = (
  error: WebhookParseError | WebhookAuthError | WebhookServiceError,
): Response => {
  switch (error._tag) {
    case "WebhookParseError":
      return Response.json(
        { ok: false, error: error.code, code: "parse_failed" },
        { status: 400 },
      );
    case "WebhookAuthError":
      return new Response("Unauthorized", { status: 401 });
    case "WebhookServiceError":
      return Response.json(
        { ok: false, error: "Internal server error" },
        { status: 500 },
      );
  }
};

// ─── Effect pipeline ───────────────────────────────────────────────────────

const webhookEffect = (
  request: Request,
  env: WorkerEnv,
  options?: HandlerOptions,
) =>
  Effect.gen(function* () {
    // 1. Read raw body
    const rawBody = yield* Effect.tryPromise({
      try: () => request.text(),
      catch: () => new WebhookParseError("invalid_json", "failed to read body"),
    });

    // 2. Verify SVIX signature
    const valid = yield* Effect.tryPromise({
      try: () =>
        verifySvixSignature(
          request.headers,
          rawBody,
          env.SANITY_WEBHOOK_SECRET,
        ),
      catch: () => new WebhookAuthError(),
    });
    if (!valid) return yield* Effect.fail(new WebhookAuthError());

    // 3. Parse JSON
    const parsed = yield* Effect.try({
      try: () => JSON.parse(rawBody) as unknown,
      catch: () => new WebhookParseError("invalid_json", "malformed JSON body"),
    });

    // 4. Validate payload via Effect Schema
    const payload = yield* S.decodeUnknown(WebhookPayload)(parsed).pipe(
      Effect.mapError(
        () =>
          new WebhookParseError("invalid_shape", "schema validation failed"),
      ),
    );

    const { _id, _type } = payload;

    // 5. Check operation
    const operation = request.headers.get("sanity-operation") ?? "update";
    if (!isAllowedOp(operation)) {
      return Response.json({ ok: true, action: "skipped_unknown_operation" });
    }

    // 6. Check document type
    if (!isAllowedType(_type)) {
      return Response.json({ ok: true, action: "skipped_unknown_type" });
    }
    const docType = _type;

    // 7. Delete path
    if (operation === "delete") {
      yield* Effect.tryPromise({
        try: () => env.SEARCH_INDEX.deleteByIds([_id]),
        catch: (err) =>
          new WebhookServiceError("delete_failed", errorMessage(err)),
      });
      return Response.json({ ok: true, action: "deleted" });
    }

    // 8. Fetch document from Sanity
    const fetchDoc =
      options?.fetchDocument ??
      ((id: string) => {
        const sanity = createClient({
          projectId: env.SANITY_PROJECT_ID,
          dataset: env.SANITY_DATASET,
          apiVersion: "2024-01-01",
          token: env.SANITY_API_TOKEN,
          useCdn: false,
        });
        return sanity.fetch(queryForType(docType), { id });
      });

    const doc = yield* Effect.tryPromise({
      try: () => fetchDoc(_id),
      catch: (err) =>
        new WebhookServiceError("sanity_fetch_failed", errorMessage(err)),
    });

    if (!doc) {
      return Response.json({ ok: true, action: "skipped_not_found" });
    }

    // 9. Build index text + metadata
    const { indexText, metadata } = yield* Effect.try({
      try: () => buildDocumentIndex(docType, doc),
      catch: (err) =>
        new WebhookServiceError(
          "invalid_document",
          `document validation failed for ${docType}: ${errorMessage(err)}`,
        ),
    });

    // 10. Embed
    // Cast needed: bge-m3 isn't in the @cloudflare/workers-types AiModels type yet
    const ai = env.AI as unknown as {
      run: (model: string, input: unknown) => Promise<{ data: number[][] }>;
    };

    const embeddingResult = yield* Effect.tryPromise({
      try: () => ai.run("@cf/baai/bge-m3", { text: [indexText] }),
      catch: (err) =>
        new WebhookServiceError("embedding_failed", errorMessage(err)),
    });

    const vector = embeddingResult.data[0];
    if (!vector) {
      return yield* Effect.fail(
        new WebhookServiceError("embedding_failed", "no vector returned"),
      );
    }

    // 11. Upsert vector
    yield* Effect.tryPromise({
      try: () =>
        env.SEARCH_INDEX.upsert([{ id: _id, values: vector, metadata }]),
      catch: (err) =>
        new WebhookServiceError("upsert_failed", errorMessage(err)),
    });

    return Response.json({ ok: true, action: "indexed" });
  });

// ─── Public handler ────────────────────────────────────────────────────────

export async function handleIndexWebhook(
  request: Request,
  env: WorkerEnv,
  options?: HandlerOptions,
): Promise<Response> {
  return Effect.runPromise(
    webhookEffect(request, env, options).pipe(
      Effect.tapError((error) =>
        Effect.sync(() => {
          if (error._tag === "WebhookServiceError") {
            console.error(`[webhook] ${error.code}: ${error.detail}`);
          }
        }),
      ),
      Effect.catchAll((error) => Effect.succeed(toErrorResponse(error))),
      Effect.catchAllDefect(() =>
        Effect.succeed(
          Response.json(
            { ok: false, error: "internal error", code: "internal" },
            { status: 500 },
          ),
        ),
      ),
    ),
  );
}
