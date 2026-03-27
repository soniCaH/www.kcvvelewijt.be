import { createClient } from "@sanity/client";
import type { WorkerEnv } from "../env";
import {
  buildArticleIndexText,
  buildPageIndexText,
  buildResponsibilityIndexText,
} from "../search/index-text";
import { verifySvixSignature } from "./svix-verify";

interface WebhookPayload {
  _id: string;
  _type: string;
  _rev?: string;
}

interface HandlerOptions {
  fetchDocument?: (id: string) => Promise<Record<string, unknown> | null>;
}

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

const parsePayload = (rawBody: string): WebhookPayload | Response => {
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>)._id !== "string" ||
      typeof (parsed as Record<string, unknown>)._type !== "string"
    ) {
      return Response.json(
        { ok: false, error: "invalid_shape", code: "parse_failed" },
        { status: 400 },
      );
    }
    return parsed as WebhookPayload;
  } catch (err) {
    console.error("[webhook] malformed JSON body:", err);
    return Response.json(
      { ok: false, error: "invalid_json", code: "parse_failed" },
      { status: 400 },
    );
  }
};

const safeFetchDoc = async (
  fetchDoc: (id: string) => Promise<Record<string, unknown> | null>,
  id: string,
): Promise<Record<string, unknown> | null | Response> => {
  try {
    return await fetchDoc(id);
  } catch (err) {
    console.error("[webhook] sanity fetch failed:", err);
    return Response.json(
      {
        ok: false,
        action: "error_fetching",
        error: errorMessage(err),
        code: "sanity_fetch_failed",
      },
      { status: 500 },
    );
  }
};

const embedText = async (
  ai: { run: (model: string, input: unknown) => Promise<{ data: number[][] }> },
  text: string,
): Promise<number[] | Response> => {
  try {
    const result = await ai.run("@cf/baai/bge-m3", { text: [text] });
    const vector = result.data[0];
    if (!vector) {
      return Response.json(
        { ok: false, error: "no vector returned", code: "embedding_failed" },
        { status: 500 },
      );
    }
    return vector;
  } catch (err) {
    console.error("[webhook] embedding failed:", err);
    return Response.json(
      { ok: false, error: errorMessage(err), code: "embedding_failed" },
      { status: 500 },
    );
  }
};

const upsertVector = async (
  index: VectorizeIndex,
  id: string,
  values: number[],
  metadata: Record<string, string>,
): Promise<Response | undefined> => {
  try {
    await index.upsert([{ id, values, metadata }]);
  } catch (err) {
    console.error("[webhook] upsert failed:", err);
    return Response.json(
      { ok: false, error: errorMessage(err), code: "upsert_failed" },
      { status: 500 },
    );
  }
};

export async function handleIndexWebhook(
  request: Request,
  env: WorkerEnv,
  options?: HandlerOptions,
): Promise<Response> {
  const rawBody = await request.text();

  const valid = await verifySvixSignature(
    request.headers,
    rawBody,
    env.SANITY_WEBHOOK_SECRET,
  );
  if (!valid) return new Response("Unauthorized", { status: 401 });

  const parsed = parsePayload(rawBody);
  if (parsed instanceof Response) return parsed;
  const { _id, _type } = parsed;

  const allowedTypes = ["responsibility", "article", "page"];
  const allowedOps = ["create", "update", "delete"];
  const operation = request.headers.get("sanity-operation") ?? "update";

  if (!allowedOps.includes(operation)) {
    return Response.json({ ok: true, action: "skipped_unknown_operation" });
  }

  if (!allowedTypes.includes(_type)) {
    return Response.json({ ok: true, action: "skipped_unknown_type" });
  }

  if (operation === "delete") {
    await env.SEARCH_INDEX.deleteByIds([_id]);
    return Response.json({ ok: true, action: "deleted" });
  }

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
      return sanity.fetch(queryForType(_type), { id });
    });

  const doc = await safeFetchDoc(fetchDoc, _id);
  if (doc instanceof Response) return doc;
  if (!doc) return Response.json({ ok: true, action: "skipped_not_found" });

  let indexText: string;
  let metadata: Record<string, string>;

  if (_type === "responsibility") {
    const d = doc as {
      title: string;
      question: string;
      keywords: string[];
      summary: string;
      slug: string;
      category: string;
    };
    indexText = buildResponsibilityIndexText(d);
    metadata = {
      slug: d.slug,
      type: "responsibility",
      title: d.title,
      excerpt: d.summary.slice(0, 200),
    };
  } else if (_type === "article") {
    const d = doc as {
      title: string;
      tags: string[];
      bodyText: string | null;
      slug: string;
      imageUrl?: string | null;
    };
    indexText = buildArticleIndexText(d);
    metadata = {
      slug: d.slug,
      type: "article",
      title: d.title,
      excerpt: (d.bodyText ?? "").slice(0, 200),
      ...(d.imageUrl ? { imageUrl: d.imageUrl } : {}),
    };
  } else {
    // page
    const d = doc as {
      title: string;
      bodyText: string | null;
      slug: string;
    };
    indexText = buildPageIndexText(d);
    metadata = {
      slug: d.slug,
      type: "page",
      title: d.title,
      excerpt: (d.bodyText ?? "").slice(0, 200),
    };
  }

  // Embed + upsert
  const ai = env.AI as unknown as {
    run: (model: string, input: unknown) => Promise<{ data: number[][] }>;
  };

  const vector = await embedText(ai, indexText);
  if (vector instanceof Response) return vector;

  const upsertError = await upsertVector(
    env.SEARCH_INDEX,
    _id,
    vector,
    metadata,
  );
  if (upsertError) return upsertError;

  return Response.json({ ok: true, action: "indexed" });
}

function queryForType(type: string): string {
  switch (type) {
    case "responsibility":
      return `*[_id == $id][0]{ _id, "slug": coalesce(slug.current,""), title, question, "keywords": coalesce(keywords,[]), "summary": coalesce(summary,""), category }`;
    case "article":
      return `*[_id == $id][0]{ _id, "slug": coalesce(slug.current,""), title, "tags": coalesce(tags,[]), "bodyText": pt::text(body), "imageUrl": coverImage.asset->url }`;
    case "page":
      return `*[_id == $id][0]{ _id, "slug": coalesce(slug.current,""), title, "bodyText": pt::text(body) }`;
    default:
      return `*[_id == $id][0]`;
  }
}
