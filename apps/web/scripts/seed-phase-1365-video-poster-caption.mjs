#!/usr/bin/env node
/*
 * apps/web/scripts/seed-phase-1365-video-poster-caption.mjs
 *
 * Phase 3 (#1365) seed for article-video-support. Creates (or updates)
 * a staging article that exercises the Phase 3 polish layer end-to-end:
 *
 *   • upload + poster + caption        (rounded 4px corners)
 *   • upload + poster + caption + fullBleed
 *   • YouTube embed + caption          (lazy-loaded iframe)
 *
 * Studio is not deployed — the canonical way to verify Phase 3 looks
 * right is the staging Vercel preview at the URL printed below.
 *
 * Idempotent: stable `_id` + slug; re-running updates the same document.
 * The video and poster assets are looked up by `originalFilename` and
 * cross-checked against the remote `Content-Length` so re-running does
 * not re-upload bytes the asset library already has.
 *
 * Fixtures:
 *   • Video — public-domain Big Buck Bunny 360p 10s 5 MB clip from
 *     test-videos.co.uk (already used by the Phase 1 tracer seed).
 *   • Poster — picsum.photos with a stable seed; produces a deterministic
 *     1280×720 JPEG so re-runs of the seed reuse the same asset.
 *
 * Override either via `SEED_VIDEO_URL` / `SEED_POSTER_URL`.
 *
 * Usage (from `apps/web`):
 *
 *   # Token: either set SANITY_API_TOKEN or rely on `sanity login`.
 *   # Dataset: SANITY_DATASET defaults to "staging".
 *   # Production guard: SANITY_ALLOW_PRODUCTION=1 required for prod.
 *
 *   node scripts/seed-phase-1365-video-poster-caption.mjs
 *
 * Revert after the feature branch merges:
 *   sanity documents delete --dataset=staging article-1365-video-phase-3
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";
const ARTICLE_ID = "article-1365-video-phase-3";
const SLUG = "test-video-phase-3-poster-caption";
const PUBLISH_AT = "2026-04-25T08:00:00.000Z";

const VIDEO_URL =
  process.env.SEED_VIDEO_URL ??
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_5MB.mp4";
const VIDEO_FILENAME = "videoblock-tracer-bigbuckbunny-360p-10s.mp4";

const POSTER_URL =
  process.env.SEED_POSTER_URL ??
  "https://picsum.photos/seed/kcvv-video-poster/1280/720";
const POSTER_FILENAME = "videoblock-phase-3-poster.jpg";

const YOUTUBE_EMBED_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw";

if (DATASET === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
  console.error(
    "Refusing to seed the Phase 3 video example into production — this " +
      "article is staging-only. Re-run with SANITY_DATASET=staging, or set " +
      "SANITY_ALLOW_PRODUCTION=1 if you truly meant to write to prod.",
  );
  process.exit(1);
}

function resolveToken() {
  if (process.env.SANITY_API_TOKEN) return process.env.SANITY_API_TOKEN;
  try {
    const configPath = join(homedir(), ".config", "sanity", "config.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    if (config.authToken) return config.authToken;
  } catch {
    /* fall through */
  }
  console.error(
    "No Sanity auth token found. Set SANITY_API_TOKEN or run `sanity login`.",
  );
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2024-01-01",
  token: resolveToken(),
  useCdn: false,
});

const FETCH_TIMEOUT_MS = 60_000;

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function inferVideoContentType(url, headerValue) {
  // Prefer the server-reported MIME type; fall back to the URL extension.
  // Schema currently accepts video/mp4 and video/webm — anything else is
  // an editorial error, so we fail loudly instead of guessing.
  if (typeof headerValue === "string" && /^video\//.test(headerValue)) {
    return headerValue.split(";")[0].trim();
  }
  const match = /\.(mp4|webm)(?:\?|#|$)/i.exec(url);
  if (match)
    return match[1].toLowerCase() === "webm" ? "video/webm" : "video/mp4";
  return "video/mp4";
}

function inferImageContentType(url, headerValue) {
  if (typeof headerValue === "string" && /^image\//.test(headerValue)) {
    return headerValue.split(";")[0].trim();
  }
  const match = /\.(jpe?g|png|webp)(?:\?|#|$)/i.exec(url);
  if (!match) return "image/jpeg";
  const ext = match[1].toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function ensureAsset({ kind, url, filename, inferContentType }) {
  // Filename is the cheap fingerprint — Sanity content-hash-dedups anyway,
  // but the filename lookup is the shortest query. The remote
  // Content-Length cross-check guards against the "same filename, new
  // fixture" case where reusing a stale asset would silently swap content.
  const docType = kind === "image" ? "sanity.imageAsset" : "sanity.fileAsset";
  const existing = await client.fetch(
    `*[_type == $docType && originalFilename == $filename][0]{_id, originalFilename, size}`,
    { docType, filename },
  );
  if (existing?._id) {
    try {
      const head = await fetchWithTimeout(url, { method: "HEAD" });
      const remoteSize = Number(head.headers.get("content-length") ?? NaN);
      if (
        Number.isFinite(remoteSize) &&
        remoteSize > 0 &&
        remoteSize === existing.size
      ) {
        console.log(
          ` · Reusing existing ${kind} asset ${existing._id} (${existing.size} bytes, content-length matches)`,
        );
        return existing._id;
      }
      console.log(
        ` · Existing ${kind} asset ${existing._id} (${existing.size} bytes) does not match remote size (${remoteSize || "unknown"}) — re-uploading.`,
      );
    } catch (err) {
      console.log(
        ` · HEAD check failed (${err instanceof Error ? err.message : "unknown"}); re-uploading to be safe.`,
      );
    }
  }

  console.log(` · Fetching ${kind} fixture from ${url}…`);
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    console.error(
      `Failed to fetch fixture ${kind}: HTTP ${response.status}. Set SEED_${kind === "image" ? "POSTER" : "VIDEO"}_URL to a reachable URL.`,
    );
    process.exit(1);
  }
  const contentType = inferContentType(
    url,
    response.headers.get("content-type"),
  );
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(
    ` · Uploading ${kind} (${buffer.byteLength} bytes) to Sanity as ${contentType}…`,
  );

  const uploaded = await client.assets.upload(kind, buffer, {
    filename,
    contentType,
  });
  console.log(` · Uploaded ${kind} asset ${uploaded._id}`);
  return uploaded._id;
}

async function main() {
  console.log(
    `Seeding Phase 3 video example (${ARTICLE_ID}) into ${DATASET} / ${PROJECT_ID}…`,
  );

  const videoAssetId = await ensureAsset({
    kind: "file",
    url: VIDEO_URL,
    filename: VIDEO_FILENAME,
    inferContentType: inferVideoContentType,
  });
  const posterAssetId = await ensureAsset({
    kind: "image",
    url: POSTER_URL,
    filename: POSTER_FILENAME,
    inferContentType: inferImageContentType,
  });

  const doc = {
    _id: ARTICLE_ID,
    _type: "article",
    articleType: "announcement",
    title: "TEST — videoBlock Phase 3 (poster, caption, fullBleed)",
    slug: { _type: "slug", current: SLUG },
    publishAt: PUBLISH_AT,
    featured: false,
    tags: ["TEST"],
    body: [
      {
        _key: "intro",
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "intro-s",
            marks: [],
            text: "Phase 3 (#1365) voor videoBlock. Deze pagina toont de drie polish-varianten naast elkaar: upload met poster + onderschrift, dezelfde video als full-bleed, en een lazy-loaded YouTube embed.",
          },
        ],
      },
      {
        _key: "video-poster-caption",
        _type: "videoBlock",
        uploadedFile: {
          _type: "file",
          asset: { _type: "reference", _ref: videoAssetId },
        },
        poster: {
          _type: "image",
          asset: { _type: "reference", _ref: posterAssetId },
        },
        caption:
          "Variant 1 — upload met poster en onderschrift. Browser laadt geen videobytes tot de bezoeker op play drukt.",
        fullBleed: false,
      },
      {
        _key: "between-1",
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "between-1-s",
            marks: [],
            text: "Hieronder dezelfde video als full-bleed: breekt uit de leestkolom, geen afgeronde hoeken.",
          },
        ],
      },
      {
        _key: "video-fullbleed",
        _type: "videoBlock",
        uploadedFile: {
          _type: "file",
          asset: { _type: "reference", _ref: videoAssetId },
        },
        poster: {
          _type: "image",
          asset: { _type: "reference", _ref: posterAssetId },
        },
        caption:
          "Variant 2 — fullBleed. Volledige viewportbreedte, mirror van articleImage full-bleed.",
        fullBleed: true,
      },
      {
        _key: "between-2",
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "between-2-s",
            marks: [],
            text: "En tot slot een YouTube-embed — de iframe heeft loading=\"lazy\", dus het wordt pas opgehaald wanneer de figuur in beeld komt.",
          },
        ],
      },
      {
        _key: "video-embed",
        _type: "videoBlock",
        embedUrl: YOUTUBE_EMBED_URL,
        caption:
          "Variant 3 — YouTube-embed met lazy-loaded iframe en onderschrift.",
        fullBleed: false,
      },
    ],
  };

  await client.createOrReplace(doc);

  console.log(`✓ Seeded ${ARTICLE_ID}`);
  console.log(
    `  Preview (Vercel previews always read the ${DATASET} dataset):`,
  );
  console.log(`    /nieuws/${SLUG}`);
  console.log(`  Document id: ${ARTICLE_ID}`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
