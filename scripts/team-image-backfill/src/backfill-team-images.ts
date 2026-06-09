/**
 * Backfill team squad photos from the legacy Drupal site into Sanity.
 *
 * Context: `team.teamImage` is an editorial Sanity field. Teams are PSD-synced
 * (PSD never sets editorial fields), so squad photos had to be migrated from
 * Drupal `node/team` during the initial cutover — that step was missed, leaving
 * every team without a photo. The photos still exist in Drupal under
 * `field_media_article_image` and are recoverable. See issue #2070.
 *
 * What it does:
 *   1. Fetch Drupal `node/team` (+ included media/files) → resolve photo URLs.
 *   2. Fetch current Sanity teams (`_id, name, age, slug, teamImage`).
 *   3. Match by age (+ name discriminator); ambiguous ages need an explicit
 *      override (SLUG_OVERRIDES) — never guessed.
 *   4. For each matched team WITHOUT an existing photo: download the JPEG,
 *      upload it as a Sanity asset, patch `team.teamImage`.
 *
 * Idempotent: teams that already have a `teamImage` are skipped (re-running is
 * a no-op). Pass `--force` to overwrite existing photos.
 *
 * Usage:
 *   # Dry-run (default dataset = staging) — prints the match plan, no writes.
 *   SANITY_DATASET=staging pnpm backfill --dry-run
 *   # Apply to staging.
 *   SANITY_DATASET=staging pnpm backfill
 *   # Apply to production (guarded).
 *   SANITY_DATASET=production SANITY_ALLOW_PRODUCTION=1 pnpm backfill
 */
import { client, dataset } from "./sanity-client";

const DRUPAL_BASE_URL = "https://api.kcvvelewijt.be";
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

/**
 * Explicit Drupal-title → Sanity-slug overrides. Used when an age band maps to
 * more than one current team (the dynamic age match can't disambiguate), or for
 * the seniors whose Drupal title ("A-Ploeg"/"B-Ploeg") carries no age token.
 *
 * The ambiguous youth bands (U7 = groen/wit, U9 = wit/groen/U9P) are left out
 * deliberately — their legacy photos are old cohorts and the target team is the
 * owner's call. Add a line here once decided, then re-run.
 */
const SLUG_OVERRIDES: Record<string, string> = {
  "A-Ploeg": "eerste-elftallen-a",
  "B-Ploeg": "eerste-elftallen-b",
  // "U7": "kcvve-u7-groen",   // owner decision (groen | wit)
  // "U9 - A": "kcvve-u9-wit",  // owner decision (wit | groen | u9p)
};

interface SanityTeam {
  _id: string;
  name: string;
  age: string | null;
  slug: string | null;
  hasImage: boolean;
}

interface DrupalTeam {
  title: string;
  imageUrl: string | null;
}

interface JsonApiResource {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data?: { id: string } | null }>;
}

/** Pull all Drupal teams with their resolved image file URLs. */
async function fetchDrupalTeams(): Promise<DrupalTeam[]> {
  const url = `${DRUPAL_BASE_URL}/jsonapi/node/team?page%5Blimit%5D=60&include=field_media_article_image.field_media_image`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Drupal fetch failed: HTTP ${res.status}`);
  const json = (await res.json()) as {
    data: JsonApiResource[];
    included?: JsonApiResource[];
  };

  const included = json.included ?? [];
  const files = new Map(
    included.filter((r) => r.type === "file--file").map((r) => [r.id, r]),
  );
  const media = new Map(
    included.filter((r) => r.type.startsWith("media")).map((r) => [r.id, r]),
  );

  const resolveImageUrl = (mediaId: string): string | null => {
    const m = media.get(mediaId);
    const fileRef = m?.relationships?.field_media_image?.data;
    if (!fileRef) return null;
    const file = files.get(fileRef.id);
    const uri = (file?.attributes?.uri as { url?: string } | undefined)?.url;
    return uri ? `${DRUPAL_BASE_URL}${uri}` : null;
  };

  return json.data.map((node) => {
    const mediaRef = node.relationships?.field_media_article_image?.data;
    return {
      title: String(node.attributes?.title ?? ""),
      imageUrl: mediaRef ? resolveImageUrl(mediaRef.id) : null,
    };
  });
}

/** Pull current (non-archived) Sanity teams. */
async function fetchSanityTeams(): Promise<SanityTeam[]> {
  return client.fetch(
    `*[_type == "team" && archived != true]{
      _id, name, age, "slug": slug.current, "hasImage": defined(teamImage)
    } | order(age asc, name asc)`,
  );
}

/** Parse an age token ("U17") from a Drupal team title; null for non-youth. */
function parseAgeToken(title: string): string | null {
  const m = title.match(/U\d{1,2}/i);
  return m ? m[0].toUpperCase() : null;
}

type MatchOutcome =
  | { kind: "matched"; team: SanityTeam }
  | { kind: "skip-no-image" }
  | { kind: "skip-already-has"; team: SanityTeam }
  | { kind: "unmatched"; reason: string };

function matchTeam(drupal: DrupalTeam, sanity: SanityTeam[]): MatchOutcome {
  if (!drupal.imageUrl) return { kind: "skip-no-image" };

  // 1) Explicit override by slug (seniors + any owner-resolved ambiguity).
  const overrideSlug = SLUG_OVERRIDES[drupal.title];
  if (overrideSlug) {
    const team = sanity.find((t) => t.slug === overrideSlug);
    if (!team)
      return {
        kind: "unmatched",
        reason: `override slug "${overrideSlug}" not found in ${dataset}`,
      };
    return team.hasImage && !FORCE
      ? { kind: "skip-already-has", team }
      : { kind: "matched", team };
  }

  // 2) Dynamic match by age band. Require the age token to also appear in the
  //    Sanity name so a band like U17 (which also holds a U16-named team) lands
  //    on the right doc.
  const age = parseAgeToken(drupal.title);
  if (!age)
    return {
      kind: "unmatched",
      reason: `no age token and no override for "${drupal.title}"`,
    };

  const candidates = sanity.filter(
    (t) => t.age === age && t.name.toUpperCase().includes(age),
  );
  if (candidates.length === 0)
    return { kind: "unmatched", reason: `no ${age} team in ${dataset}` };
  if (candidates.length > 1)
    return {
      kind: "unmatched",
      reason: `ambiguous — ${candidates.length} ${age} teams (${candidates
        .map((c) => c.slug)
        .join(", ")}); add a SLUG_OVERRIDES entry`,
    };

  const team = candidates[0];
  return team.hasImage && !FORCE
    ? { kind: "skip-already-has", team }
    : { kind: "matched", team };
}

/** Download a Drupal image and upload it as a Sanity image asset. */
async function uploadImage(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`image fetch failed: HTTP ${res.status} ${imageUrl}`);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = decodeURIComponent(imageUrl.split("/").pop() ?? "team.jpg");
  const asset = await client.assets.upload("image", buffer, {
    filename,
    contentType,
  });
  return asset._id;
}

async function main(): Promise<void> {
  if (dataset === "production" && process.env.SANITY_ALLOW_PRODUCTION !== "1") {
    console.error(
      "Refusing to write to production. Set SANITY_ALLOW_PRODUCTION=1 to proceed.",
    );
    process.exit(1);
  }

  console.log(
    `\nTeam-image backfill — dataset=${dataset} ${DRY_RUN ? "(DRY RUN)" : ""}${
      FORCE ? " (FORCE)" : ""
    }\n`,
  );

  const [drupalTeams, sanityTeams] = await Promise.all([
    fetchDrupalTeams(),
    fetchSanityTeams(),
  ]);

  const planned: { drupal: DrupalTeam; team: SanityTeam }[] = [];
  const skippedHas: string[] = [];
  const skippedNoImg: string[] = [];
  const unmatched: string[] = [];

  for (const drupal of drupalTeams) {
    const outcome = matchTeam(drupal, sanityTeams);
    switch (outcome.kind) {
      case "matched":
        planned.push({ drupal, team: outcome.team });
        console.log(
          `  MATCH   ${drupal.title.padEnd(12)} → ${outcome.team.name} (${outcome.team.slug})`,
        );
        break;
      case "skip-already-has":
        skippedHas.push(`${drupal.title} → ${outcome.team.slug}`);
        break;
      case "skip-no-image":
        skippedNoImg.push(drupal.title);
        break;
      case "unmatched":
        unmatched.push(`${drupal.title} — ${outcome.reason}`);
        break;
    }
  }

  console.log(
    `\nPlan: ${planned.length} to upload · ${skippedHas.length} already have a photo · ` +
      `${skippedNoImg.length} no legacy image · ${unmatched.length} unmatched\n`,
  );
  if (unmatched.length) {
    console.log("Unmatched / needs decision:");
    unmatched.forEach((u) => console.log(`  - ${u}`));
    console.log("");
  }

  if (DRY_RUN) {
    console.log("Dry run — no writes performed.");
    return;
  }

  let uploaded = 0;
  for (const { drupal, team } of planned) {
    try {
      const assetId = await uploadImage(drupal.imageUrl!);
      await client
        .patch(team._id)
        .set({
          teamImage: {
            _type: "image",
            asset: { _type: "reference", _ref: assetId },
          },
        })
        .commit();
      uploaded += 1;
      console.log(`  ✓ ${team.name} ← ${drupal.title}`);
    } catch (err) {
      console.error(`  ✗ ${team.name} ← ${drupal.title}: ${(err as Error).message}`);
    }
  }

  console.log(`\nDone — ${uploaded}/${planned.length} photos written to ${dataset}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
