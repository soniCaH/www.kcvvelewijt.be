/**
 * Curated, deterministic image-fixture pool for Storybook + VR.
 *
 * Why this exists: remote placeholder services (placehold.co, picsum,
 * unsplash) produce non-deterministic VR baselines — one network blip
 * during `pnpm vr:update` ships a corrupted snapshot as truth. Local
 * fixtures sourced from the production Sanity dataset eliminate that
 * flake class and surface real layout bugs (long Dutch headlines,
 * portrait-in-landscape-slot, scoreboard chrome, etc.).
 *
 * Sourced via `pnpm --filter @kcvv/web fixtures:sync`. Pool composition
 * is pinned in `manifest.json` — never edit the WebP files by hand.
 */

import manifestRaw from "./manifest.json" with { type: "json" };

export type FixtureShape =
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

const manifest = manifestRaw as Manifest;

const FIXTURES: Record<FixtureShape, readonly string[]> = (() => {
  const acc: Partial<Record<FixtureShape, string[]>> = {};
  for (const entry of manifest.fixtures) {
    (acc[entry.shape] ??= []).push(`/test-fixtures/images/${entry.filename}`);
  }
  return acc as Record<FixtureShape, readonly string[]>;
})();

/**
 * Returns a deterministic local fixture path for the given shape.
 *
 * `index` lets a story pick a specific fixture so siblings render
 * visibly different content (e.g. `[0,1,2,3,4]` for a 5-card grid).
 * The index wraps modulo the pool size, so callers don't need to
 * track exact pool counts.
 *
 * The returned path is served by Storybook's `staticDirs` config at
 * `/test-fixtures/images/...` — it is not bundled into Next.js prod.
 */
export const fixtureImage = (
  shape: FixtureShape,
  index: number = 0,
): string => {
  const pool = FIXTURES[shape];
  if (!pool || pool.length === 0) {
    throw new Error(
      `No fixture images registered for shape "${shape}". Run \`pnpm --filter @kcvv/web fixtures:sync\` to populate the pool.`,
    );
  }
  return pool[index % pool.length]!;
};

/** Pool counts per shape — useful for diagnostic stories / tests. */
export const fixturePoolSize = (shape: FixtureShape): number =>
  FIXTURES[shape]?.length ?? 0;

/** All fixtures for a shape (read-only). */
export const fixturesForShape = (shape: FixtureShape): readonly string[] =>
  FIXTURES[shape] ?? [];
