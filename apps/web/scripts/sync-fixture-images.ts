#!/usr/bin/env tsx
/**
 * apps/web/scripts/sync-fixture-images.ts
 *
 * Curates a local image-fixture pool for Storybook + VR by sourcing
 * representative images from the production Sanity dataset. Replaces
 * remote placeholder URLs (placehold.co, picsum, unsplash) that would
 * otherwise produce flaky, network-dependent VR baselines.
 *
 * Behaviour:
 *   - Idempotent: hashes downloaded bytes; skips if hash already on disk.
 *   - CDN-first: uses Sanity's `?w=&fit=max&fm=webp&q=80` URL params for
 *     resize/transcode; only falls back to `sharp` when a crop is needed
 *     that the CDN can't express (e.g. 1:1 from a 3:4 source).
 *   - Manifest-driven: `manifest.json` pins source `_id` / asset ref / hash
 *     / processing-path per fixture. A re-run with the same manifest is
 *     a no-op.
 *
 * Run:
 *   pnpm --filter @kcvv/web fixtures:sync
 *
 * Optional flags:
 *   --refresh   Re-discover candidate images via GROQ even if the manifest
 *               already has entries. Use after schema/content changes.
 *   --dry-run   Print planned actions without writing files.
 */

import { createClient } from "@sanity/client";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// -----------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(__dirname, "../test/fixtures/images");
const MANIFEST_PATH = join(FIXTURE_DIR, "manifest.json");

const PROJECT_ID = "vhb33jaz";
const DATASET = "production";

const args = new Set(process.argv.slice(2));
const REFRESH = args.has("--refresh");
const DRY_RUN = args.has("--dry-run");

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2024-01-01",
  useCdn: true,
});

type FixtureShape =
  | "article-hero-interview"
  | "article-hero-matchverslag"
  | "article-hero-transfer"
  | "article-hero-jeugd"
  | "article-hero-evenement"
  | "article-hero-generic"
  | "news-thumb-square"
  | "player-portrait"
  | "player-portrait-square"
  | "staff-portrait"
  | "event-cover"
  | "match-action"
  | "match-action-portrait"
  | "team-group"
  | "stadium-hero"
  | "training"
  | "crowd-atmosphere"
  | "sponsor-logo";

type GroqShape = {
  kind: "groq";
  query: string;
  width: number;
  height: number;
  aspect: string;
  poolSize: number;
  // When set, the CDN-downloaded bytes are run through sharp to reach
  // the target geometry (e.g. when source is square but shape needs 3:4).
  postProcess?: {
    position:
      | sharp.Gravity
      | (typeof sharp.strategy)[keyof typeof sharp.strategy];
  };
};

type CropShape = {
  kind: "crop";
  from: FixtureShape;
  width: number;
  height: number;
  aspect: string;
  poolSize: number;
  position:
    | sharp.Gravity
    | (typeof sharp.strategy)[keyof typeof sharp.strategy];
};

type ShapeSpec = GroqShape | CropShape;

const TARGET_WIDTH_HERO = 1200;
const TARGET_WIDTH_THUMB = 600;
const TARGET_WIDTH_PORTRAIT = 480;
const TARGET_WIDTH_LOGO = 240;

// 16:9 → 1200x675; 1:1 → 600x600; 3:4 → 480x640; logo → 240x160
const SHAPES: Record<FixtureShape, ShapeSpec> = {
  "article-hero-interview": {
    // Production has zero `articleType=="interview"` docs (Phase-3 redesign
    // not seeded). Fall back to oldest-tier A-Ploeg announcements; PR
    // privacy pass replaces if mismatched.
    kind: "groq",
    query: `*[_type=="article" && articleType=="announcement" && "A-Ploeg" in tags && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [30...50] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "article-hero-matchverslag": {
    // No "Matchverslag" tag exists; A-Ploeg announcement articles are the
    // closest semantic match. Owner privacy pass on the PR catches misses.
    kind: "groq",
    query: `*[_type=="article" && articleType=="announcement" && "A-Ploeg" in tags && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...12] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "article-hero-transfer": {
    // Production uses the "Transfernieuws" tag, not articleType=="transfer".
    kind: "groq",
    query: `*[_type=="article" && "Transfernieuws" in tags && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...12] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "article-hero-jeugd": {
    kind: "groq",
    query: `*[_type=="article" && "Jeugd" in tags && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...12] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "article-hero-evenement": {
    kind: "groq",
    query: `*[_type=="article" && (articleType=="event" || "Evenement" in tags) && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...12] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "article-hero-generic": {
    kind: "groq",
    query: `*[_type=="article" && articleType=="announcement" && !("A-Ploeg" in tags) && !("Jeugd" in tags) && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...12] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "news-thumb-square": {
    kind: "crop",
    from: "article-hero-generic",
    width: TARGET_WIDTH_THUMB,
    height: TARGET_WIDTH_THUMB,
    aspect: "1:1",
    poolSize: 3,
    position: sharp.strategy.attention,
  },
  "player-portrait": {
    // PSD-synced players ship square `psdImage` (350x350). Crop to 3:4 with
    // attention strategy so the face stays in-frame.
    kind: "groq",
    query: `*[_type=="player" && defined(psdImage.asset._ref) && !(_id in path("drafts.**"))] | order(lastName asc) [0...30] {_id, "slug": coalesce(slug.current, _id), "ref": psdImage.asset._ref}`,
    width: TARGET_WIDTH_PORTRAIT,
    height: 640,
    aspect: "3:4",
    poolSize: 5,
    postProcess: { position: sharp.strategy.attention },
  },
  "player-portrait-square": {
    kind: "crop",
    from: "player-portrait",
    width: TARGET_WIDTH_THUMB,
    height: TARGET_WIDTH_THUMB,
    aspect: "1:1",
    poolSize: 3,
    position: "north", // faces tend to sit upper-third in portraits
  },
  "staff-portrait": {
    kind: "groq",
    query: `*[_type=="staffMember" && defined(photo.asset._ref) && !(_id in path("drafts.**"))] | order(lastName asc) [0...12] {_id, "slug": coalesce(slug.current, lastName, _id), "ref": photo.asset._ref}`,
    width: TARGET_WIDTH_PORTRAIT,
    height: 640,
    aspect: "3:4",
    poolSize: 3,
  },
  "event-cover": {
    kind: "groq",
    query: `*[_type=="event" && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(dateStart desc) [0...12] {_id, "slug": coalesce(slug.current, _id), "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "match-action": {
    // No semantic tag; reuse A-Ploeg announcement covers (most are match
    // photos). Owner privacy pass to confirm.
    kind: "groq",
    query: `*[_type=="article" && "A-Ploeg" in tags && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [12...30] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "match-action-portrait": {
    kind: "crop",
    from: "match-action",
    width: TARGET_WIDTH_PORTRAIT,
    height: 640,
    aspect: "3:4",
    poolSize: 3,
    position: sharp.strategy.attention,
  },
  "team-group": {
    // The `team` document type ships no team-photo field. Fall back to
    // A-Ploeg article covers (different slice from match-action).
    kind: "groq",
    query: `*[_type=="article" && "A-Ploeg" in tags && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [50...70] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "stadium-hero": {
    // No dedicated content type; pull from "Clubinfo"-tagged articles.
    kind: "groq",
    query: `*[_type=="article" && "Clubinfo" in tags && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...12] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  training: {
    // No semantic tag; reuse Jeugd covers (training-heavy).
    kind: "groq",
    query: `*[_type=="article" && "Jeugd" in tags && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [12...30] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "crowd-atmosphere": {
    // No semantic tag; reuse Beker Van Zemst (cup runs draw crowds).
    kind: "groq",
    query: `*[_type=="article" && ("Beker Van Zemst" in tags || "Beker Van Brabant" in tags) && defined(coverImage.asset._ref) && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...12] {_id, slug, "ref": coverImage.asset._ref}`,
    width: TARGET_WIDTH_HERO,
    height: 675,
    aspect: "16:9",
    poolSize: 3,
  },
  "sponsor-logo": {
    kind: "groq",
    query: `*[_type=="sponsor" && defined(logo.asset._ref) && !(_id in path("drafts.**"))] | order(_updatedAt desc) [0...12] {_id, "slug": coalesce(slug.current, _id, name), "ref": logo.asset._ref}`,
    width: TARGET_WIDTH_LOGO,
    height: 160,
    aspect: "free",
    poolSize: 3,
  },
};

// -----------------------------------------------------------------------
// Manifest types
// -----------------------------------------------------------------------

type ManifestEntry = {
  shape: FixtureShape;
  filename: string;
  sourceId: string;
  assetRef: string;
  hash: string;
  processingPath: "cdn" | "sharp";
  width: number;
  height: number;
  slug: string;
};

type Manifest = {
  generatedAt: string;
  fixtures: ManifestEntry[];
};

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

const slugify = (raw: string): string =>
  raw
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "fixture";

const aspectToken = (aspect: string): string =>
  aspect.replace(/:/g, "-").replace(/[^a-z0-9-]+/gi, "");

const cdnUrlForRef = (ref: string, width: number): string => {
  // image-<id>-<dim>-<ext> → e.g. image-abc123-1200x800-jpg
  const match = /^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/.exec(ref);
  if (!match) {
    throw new Error(`Cannot parse Sanity asset ref: ${ref}`);
  }
  const [, id, , , ext] = match;
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}-${match[2]}x${match[3]}.${ext}?w=${width}&fit=max&fm=webp&q=80`;
};

const hashBytes = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex").slice(0, 16);

const fetchBytes = async (url: string): Promise<Uint8Array> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}): ${url}`);
  }
  return new Uint8Array(await res.arrayBuffer());
};

const readManifest = async (): Promise<Manifest> => {
  if (!existsSync(MANIFEST_PATH)) {
    return { generatedAt: new Date().toISOString(), fixtures: [] };
  }
  const raw = await readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as Manifest;
};

const writeManifest = async (manifest: Manifest): Promise<void> => {
  if (DRY_RUN) {
    console.log(
      `[dry-run] would write manifest with ${manifest.fixtures.length} fixtures`,
    );
    return;
  }
  await writeFile(
    MANIFEST_PATH,
    JSON.stringify(
      { ...manifest, generatedAt: new Date().toISOString() },
      null,
      2,
    ) + "\n",
  );
};

// -----------------------------------------------------------------------
// Sync logic
// -----------------------------------------------------------------------

type Candidate = { sourceId: string; slug: string; assetRef: string };

const queryCandidates = async (spec: GroqShape): Promise<Candidate[]> => {
  const rows = (await client.fetch(spec.query)) as Array<{
    _id: string;
    slug?: { current?: string } | string;
    ref: string;
  }>;
  return rows.map((row) => ({
    sourceId: row._id,
    slug:
      typeof row.slug === "string" ? row.slug : (row.slug?.current ?? row._id),
    assetRef: row.ref,
  }));
};

const ensureGroqShape = async (
  shape: FixtureShape,
  spec: GroqShape,
  manifest: Manifest,
): Promise<void> => {
  const existing = manifest.fixtures.filter((f) => f.shape === shape);
  if (existing.length >= spec.poolSize && !REFRESH) {
    console.log(`✓ ${shape}: ${existing.length}/${spec.poolSize} (cached)`);
    return;
  }

  const candidates = await queryCandidates(spec);
  if (candidates.length === 0) {
    console.warn(`⚠ ${shape}: GROQ returned 0 candidates`);
    return;
  }

  // Honour already-pinned manifest entries; only top up to poolSize.
  const pinnedIds = new Set(existing.map((f) => f.sourceId));
  const pinnedRefs = new Set(existing.map((f) => f.assetRef));
  const additions = candidates.filter(
    (c) => !pinnedIds.has(c.sourceId) && !pinnedRefs.has(c.assetRef),
  );
  const need = REFRESH ? spec.poolSize : spec.poolSize - existing.length;
  const seenHashes = new Set(existing.map((f) => f.hash));
  let added = 0;

  for (const cand of additions) {
    if (added >= need) break;
    // Source asset bytes (CDN-resized to target width to keep download small).
    const url = cdnUrlForRef(cand.assetRef, spec.width);
    const sourceBytes = DRY_RUN ? new Uint8Array() : await fetchBytes(url);

    let outBytes: Uint8Array;
    let processingPath: "cdn" | "sharp";
    if (spec.postProcess && !DRY_RUN) {
      // Crop CDN-fetched bytes to exact target geometry.
      outBytes = new Uint8Array(
        await sharp(sourceBytes)
          .resize(spec.width, spec.height, {
            fit: "cover",
            position: spec.postProcess.position,
          })
          .webp({ quality: 80 })
          .toBuffer(),
      );
      processingPath = "sharp";
    } else {
      outBytes = sourceBytes;
      processingPath = spec.postProcess ? "sharp" : "cdn";
    }

    const hash = DRY_RUN
      ? `DRYRUN${added}`.padEnd(16, "0")
      : hashBytes(outBytes);
    if (seenHashes.has(hash)) {
      console.log(
        `  ↺ ${shape} :: ${cand.slug} skipped (duplicate hash ${hash.slice(0, 6)})`,
      );
      continue;
    }
    seenHashes.add(hash);

    console.log(`  → ${shape} :: ${cand.slug} (${cand.sourceId})`);
    const filename = `${shape}-${slugify(cand.slug)}-${aspectToken(spec.aspect)}-${hash.slice(0, 6)}.webp`;
    const filepath = join(FIXTURE_DIR, filename);
    if (!DRY_RUN && !existsSync(filepath)) {
      await writeFile(filepath, outBytes);
    }
    manifest.fixtures.push({
      shape,
      filename,
      sourceId: cand.sourceId,
      assetRef: cand.assetRef,
      hash,
      processingPath,
      width: spec.width,
      height: spec.height,
      slug: slugify(cand.slug),
    });
    added += 1;
  }
};

const ensureCropShape = async (
  shape: FixtureShape,
  spec: CropShape,
  manifest: Manifest,
): Promise<void> => {
  const existing = manifest.fixtures.filter((f) => f.shape === shape);
  if (existing.length >= spec.poolSize && !REFRESH) {
    console.log(`✓ ${shape}: ${existing.length}/${spec.poolSize} (cached)`);
    return;
  }

  const sourcePool = manifest.fixtures.filter((f) => f.shape === spec.from);
  if (sourcePool.length === 0) {
    console.warn(
      `⚠ ${shape}: source shape "${spec.from}" pool is empty — run again after sync`,
    );
    return;
  }

  const need = REFRESH ? spec.poolSize : spec.poolSize - existing.length;
  const sources = sourcePool.slice(0, need);

  for (const src of sources) {
    const srcPath = join(FIXTURE_DIR, src.filename);
    console.log(
      `  → ${shape} :: crop ${spec.from}/${src.slug} (${spec.width}x${spec.height})`,
    );
    let outBytes: Uint8Array;
    let hash: string;
    if (DRY_RUN) {
      outBytes = new Uint8Array();
      hash = "DRYRUN0000000000";
    } else {
      outBytes = new Uint8Array(
        await sharp(srcPath)
          .resize(spec.width, spec.height, {
            fit: "cover",
            position: spec.position,
          })
          .webp({ quality: 80 })
          .toBuffer(),
      );
      hash = hashBytes(outBytes);
    }
    const filename = `${shape}-${src.slug}-${aspectToken(spec.aspect)}-${hash.slice(0, 6)}.webp`;
    const filepath = join(FIXTURE_DIR, filename);
    if (!DRY_RUN && !existsSync(filepath)) {
      await writeFile(filepath, outBytes);
    }
    manifest.fixtures.push({
      shape,
      filename,
      sourceId: src.sourceId,
      assetRef: src.assetRef,
      hash,
      processingPath: "sharp",
      width: spec.width,
      height: spec.height,
      slug: src.slug,
    });
  }
};

const pruneOrphans = async (manifest: Manifest): Promise<void> => {
  const tracked = new Set(manifest.fixtures.map((f) => f.filename));
  const onDisk = (await readdir(FIXTURE_DIR)).filter((n) =>
    n.endsWith(".webp"),
  );
  for (const name of onDisk) {
    if (tracked.has(name)) continue;
    console.log(`  ✕ orphan: ${name}`);
    if (!DRY_RUN) {
      await unlink(join(FIXTURE_DIR, name));
    }
  }
};

// -----------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------

const main = async (): Promise<void> => {
  await mkdir(FIXTURE_DIR, { recursive: true });
  const manifest = await readManifest();

  if (REFRESH) {
    manifest.fixtures = [];
  }

  // Two-pass: GROQ shapes first, then crop shapes that depend on them.
  for (const shape of Object.keys(SHAPES) as FixtureShape[]) {
    const spec = SHAPES[shape];
    if (spec.kind === "groq") {
      await ensureGroqShape(shape, spec, manifest);
    }
  }
  for (const shape of Object.keys(SHAPES) as FixtureShape[]) {
    const spec = SHAPES[shape];
    if (spec.kind === "crop") {
      await ensureCropShape(shape, spec, manifest);
    }
  }

  await pruneOrphans(manifest);
  await writeManifest(manifest);

  // Summary
  const counts = new Map<FixtureShape, number>();
  for (const f of manifest.fixtures) {
    counts.set(f.shape, (counts.get(f.shape) ?? 0) + 1);
  }
  console.log("");
  console.log("Pool summary:");
  for (const shape of Object.keys(SHAPES) as FixtureShape[]) {
    const want = SHAPES[shape].poolSize;
    const got = counts.get(shape) ?? 0;
    const status = got >= want ? "✓" : "⚠";
    console.log(`  ${status} ${shape}: ${got}/${want}`);
  }
};

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
