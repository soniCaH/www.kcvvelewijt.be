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

  const payload = JSON.parse(rawBody) as WebhookPayload;
  const { _id, _type } = payload;

  const operation = request.headers.get("sanity-operation") ?? "update";

  if (operation === "delete") {
    await env.SEARCH_INDEX.deleteByIds([_id]);
    return Response.json({ ok: true, action: "deleted" });
  }

  if (!["responsibilityPath", "article", "page"].includes(_type)) {
    return Response.json({ ok: true, action: "skipped_unknown_type" });
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

  const doc = await fetchDoc(_id);
  if (!doc) return Response.json({ ok: true, action: "skipped_not_found" });

  let indexText: string;
  let metadata: Record<string, string>;

  if (_type === "responsibilityPath") {
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
      type: "responsibilityPath",
      title: d.title,
      excerpt: d.summary.slice(0, 200),
    };
  } else if (_type === "article") {
    const d = doc as {
      title: string;
      tags: string[];
      bodyText: string | null;
      slug: string;
    };
    indexText = buildArticleIndexText(d);
    metadata = {
      slug: d.slug,
      type: "article",
      title: d.title,
      excerpt: (d.bodyText ?? "").slice(0, 200),
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
  const result = await ai.run("@cf/baai/bge-m3", { text: [indexText] });
  const vector = result.data[0];
  if (!vector)
    return Response.json(
      { ok: false, error: "embedding_failed" },
      { status: 500 },
    );

  await env.SEARCH_INDEX.upsert([{ id: _id, values: vector, metadata }]);
  return Response.json({ ok: true, action: "indexed" });
}

function queryForType(type: string): string {
  switch (type) {
    case "responsibilityPath":
      return `*[_id == $id][0]{ _id, "slug": coalesce(slug.current,""), title, question, "keywords": coalesce(keywords,[]), "summary": coalesce(summary,""), category }`;
    case "article":
      return `*[_id == $id][0]{ _id, "slug": coalesce(slug.current,""), title, "tags": coalesce(tags,[]), "bodyText": pt::text(body) }`;
    case "page":
      return `*[_id == $id][0]{ _id, "slug": coalesce(slug.current,""), title, "bodyText": pt::text(body) }`;
    default:
      return `*[_id == $id][0]`;
  }
}
