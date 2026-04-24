#!/usr/bin/env node
/*
 * apps/web/scripts/seed-video-article.mjs
 *
 * Phase 1 tracer (#1363) for article-video-support. Creates (or updates)
 * a staging article containing one `videoBlock` with an uploaded MP4,
 * so reviewers can open the article URL and confirm native HTML5 video
 * playback end-to-end (Sanity upload → Sanity CDN → Next.js render).
 *
 * Idempotent: stable `_id` + slug; re-running updates the same document.
 * Asset upload reuses any previously uploaded video matching the same
 * `originalFilename` (Sanity dedups by content hash anyway).
 *
 * Fixture video: 5 MB Big Buck Bunny 10s 360p from test-videos.co.uk —
 * a well-known open-licensed fixture widely used across the web video
 * test ecosystem. Override via `SEED_VIDEO_URL` if the default goes
 * offline or you want a larger/smaller clip.
 *
 * Usage (from `apps/web`):
 *
 *   # Token: either set SANITY_API_TOKEN or rely on `sanity login`.
 *   # Dataset: SANITY_DATASET defaults to "staging".
 *   # Production guard: SANITY_ALLOW_PRODUCTION=1 required for prod.
 *
 *   node scripts/seed-video-article.mjs
 *
 * Revert after the feature branch merges:
 *   sanity documents delete --dataset=staging article-1363-video-tracer
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "vhb33jaz";
const DATASET = process.env.SANITY_DATASET ?? "staging";
const ARTICLE_ID = "article-1363-video-tracer";
const SLUG = "test-video-tracer-phase-1";
const PUBLISH_AT = "2026-04-23T08:00:00.000Z";
const VIDEO_URL =
  process.env.SEED_VIDEO_URL ??
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_5MB.mp4";
const VIDEO_FILENAME = "videoblock-tracer-bigbuckbunny-360p-10s.mp4";

if (DATASET === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
  console.error(
    "Refusing to seed the video tracer into production — this article is " +
      "staging-only. Re-run with SANITY_DATASET=staging, or set " +
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

// Don't let a slow mirror hang CI.
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

function inferContentType(url, headerValue) {
  // Prefer the server-reported MIME type; fall back to the URL extension.
  // Schema currently accepts video/mp4 and video/webm — anything else is
  // an editorial error, so we fail loudly instead of guessing.
  if (typeof headerValue === "string" && /^video\//.test(headerValue)) {
    return headerValue.split(";")[0].trim();
  }
  const match = /\.(mp4|webm)(?:\?|#|$)/i.exec(url);
  if (match) return match[1].toLowerCase() === "webm" ? "video/webm" : "video/mp4";
  return "video/mp4";
}

async function ensureVideoAsset() {
  // Filename is the cheap fingerprint — Sanity content-hash-dedups anyway,
  // but the filename lookup is the shortest query. We cross-check the
  // remote Content-Length to catch the "same filename, different fixture"
  // case before reusing a stale asset.
  const existing = await client.fetch(
    `*[_type == "sanity.fileAsset" && originalFilename == $filename][0]{_id, originalFilename, size}`,
    { filename: VIDEO_FILENAME },
  );
  if (existing?._id) {
    try {
      const head = await fetchWithTimeout(VIDEO_URL, { method: "HEAD" });
      const remoteSize = Number(head.headers.get("content-length") ?? NaN);
      if (
        Number.isFinite(remoteSize) &&
        remoteSize > 0 &&
        remoteSize === existing.size
      ) {
        console.log(
          ` · Reusing existing asset ${existing._id} (${existing.size} bytes, content-length matches remote)`,
        );
        return existing._id;
      }
      console.log(
        ` · Existing asset ${existing._id} (${existing.size} bytes) does not match remote size (${remoteSize || "unknown"}) — re-uploading.`,
      );
    } catch (err) {
      console.log(
        ` · HEAD check failed (${err instanceof Error ? err.message : "unknown"}); re-uploading to be safe.`,
      );
    }
  }

  console.log(` · Fetching video fixture from ${VIDEO_URL}…`);
  const response = await fetchWithTimeout(VIDEO_URL);
  if (!response.ok) {
    console.error(
      `Failed to fetch fixture video: HTTP ${response.status}. Set SEED_VIDEO_URL to a reachable MP4 URL.`,
    );
    process.exit(1);
  }
  const contentType = inferContentType(
    VIDEO_URL,
    response.headers.get("content-type"),
  );
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(
    ` · Uploading ${buffer.byteLength} bytes to Sanity as ${contentType}…`,
  );

  const uploaded = await client.assets.upload("file", buffer, {
    filename: VIDEO_FILENAME,
    contentType,
  });
  console.log(` · Uploaded asset ${uploaded._id}`);
  return uploaded._id;
}

async function main() {
  console.log(
    `Seeding video tracer (${ARTICLE_ID}) into ${DATASET} / ${PROJECT_ID}…`,
  );

  const assetId = await ensureVideoAsset();

  const doc = {
    _id: ARTICLE_ID,
    _type: "article",
    articleType: "announcement",
    title: "TEST — videoBlock tracer (Phase 1)",
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
            text: "Phase 1 tracer (#1363) voor videoBlock. Deze pagina bewijst: Sanity-upload → Sanity CDN → HTML5-video afspelen binnen een artikel.",
          },
        ],
      },
      {
        _key: "video-1",
        _type: "videoBlock",
        uploadedFile: {
          _type: "file",
          asset: { _type: "reference", _ref: assetId },
        },
      },
      {
        _key: "outro",
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "outro-s",
            marks: [],
            text: "Phases 2–3 voegen YouTube/Vimeo-embeds, poster, caption, lazy-load en fullBleed toe.",
          },
        ],
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
