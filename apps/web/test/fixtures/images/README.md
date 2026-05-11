# Storybook Image Fixtures

Curated, deterministic image-fixture pool used by `*.stories.tsx` files
and Visual-Regression (VR) snapshots. Replaces remote placeholder
services (placehold.co, picsum, unsplash) that produced flaky baselines.

## Why local fixtures

- **Determinism.** A single 503 from `placehold.co` during `pnpm vr:update`
  was enough to ship a corrupted baseline as truth — the test runner
  captured a broken-image render and committed it as the new ground
  truth. Local files eliminate that flake class.
- **Realism.** A 600×400 grey rectangle never exposed the layout bugs
  that real KCVV content surfaces — long Dutch headlines wrapping over
  a face, portrait subjects squeezed into 16:9 slots, scoreboard chrome
  bleeding into card edges.

## Usage in stories

```typescript
import { fixtureImage } from "@test-fixtures/images";

// Pick deterministically by index — siblings render different content
const meta = {
  args: { imageUrl: fixtureImage("article-hero-interview", 0) },
};

// In a list, pick a different fixture per item
{items.map((item, i) => (
  <Card imageUrl={fixtureImage("news-thumb-square", i)} />
))}
```

`fixtureImage(shape, index)` returns a path served by Storybook's
`staticDirs` config at `/test-fixtures/images/...`. The index wraps
modulo pool size, so callers don't need to track exact counts.

## How the pool is curated

Run `pnpm --filter @kcvv/web fixtures:sync` to refresh from production
Sanity. The script is idempotent: re-running with the same manifest
downloads zero bytes if hashes match. Use `--refresh` to re-discover
candidates after schema/content changes; use `--dry-run` to preview
actions.

Behaviour:

- **CDN-first.** Sanity's `?w=…&fit=max&fm=webp&q=80` URL params handle
  resize + transcode for free. The script only uses `sharp` when a
  shape needs a crop the CDN can't express (e.g. cropping a 1:1 PSD
  image to 3:4 with attention-based positioning).
- **Manifest-pinned.** `manifest.json` records the source `_id`,
  asset ref, content hash, processing path (`cdn` vs `sharp`), and
  output geometry per fixture. Re-runs honour pinned entries — drop
  an entry from the manifest and re-sync to replace it.
- **Hash-deduped.** If two source documents reference the same Sanity
  asset, only the first is added to the pool.
- **Orphan cleanup.** WebP files on disk that aren't referenced by the
  manifest are removed on each sync run.

## Shape table

| Shape                       | Aspect | Use case                                                | Pool |
| --------------------------- | ------ | ------------------------------------------------------- | ---- |
| `article-hero-interview`    | 16:9   | InterviewHero, EditorialHero (interview)                | 3    |
| `article-hero-matchverslag` | 16:9   | Match-recap hero                                        | 3    |
| `article-hero-transfer`     | 16:9   | TransferAnnouncementHero                                | 3    |
| `article-hero-jeugd`        | 16:9   | Youth news hero                                         | 3    |
| `article-hero-evenement`    | 16:9   | Event-announcement hero                                 | 3    |
| `article-hero-generic`      | 16:9   | Default / column / fallback                             | 3    |
| `news-thumb-square`         | 1:1    | NewsGrid square thumbs                                  | 3    |
| `player-portrait`           | 3:4    | PlayerHero, PlayerFigure (cropped from square psdImage) | 5    |
| `player-portrait-square`    | 1:1    | Compact player tiles                                    | 3    |
| `staff-portrait`            | 3:4    | Coaching staff, trainers                                | 3    |
| `event-cover`               | 16:9   | FeaturedEventBand, EventCard                            | 3    |
| `match-action`              | 16:9   | Match preview / recap action                            | 3    |
| `match-action-portrait`     | 3:4    | Vertical match-action for mobile cards                  | 3    |
| `team-group`                | 16:9   | TeamHero, TeamCard                                      | 3    |
| `stadium-hero`              | 16:9   | Stadium / venue heroes                                  | 3    |
| `training`                  | 16:9   | Training / behind-the-scenes                            | 3    |
| `crowd-atmosphere`          | 16:9   | Supporter / crowd shots                                 | 3    |
| `sponsor-logo`              | free   | SponsorBar, SponsorWall                                 | 3    |

Some shapes resolve via fallback queries because production data lacks
a clean semantic field — e.g. `team-group` pulls A-Ploeg article covers
because the `team` document has no team-photo field, and `stadium-hero`
pulls from "Clubinfo"-tagged articles. The PR's owner-privacy-pass
checklist surfaces every chosen image so misses can be replaced before
merge by editing `manifest.json` and re-syncing.

## Privacy & licensing

- Use only photos already published on the live site (no draft assets).
- Avoid clearly-identifiable face shots of minors. Crowd / action shots
  taken at distance are fine.
- Adult player and staff portraits already published on the live site
  with consent are fine to re-use as fixtures.
- Sponsor logos already published on `kcvvelewijt.be` are fine.

Each PR that touches the fixture pool must list every chosen image in
the PR body (shape + slug + source `_id`) so the club owner can sign
off before merge.

## Regeneration tips

- The full sync is fast (~10–20 s wall time, dominated by network).
- After changing a shape's GROQ query, run with `--refresh` to clear
  prior picks.
- To replace one fixture, delete its `manifest.json` entry and its
  WebP file, then run `pnpm fixtures:sync` — the script tops up to
  pool size with the next available candidate.
- After refreshing the pool, re-baseline VR (`pnpm vr:update`) in the
  same PR — see memory `feedback_vr_baseline_in_same_pr.md`.

## Imgbot

Imgbot optimises every image in the repo except the patterns listed in
`.imgbotconfig`. The fixture pool is **not** excluded — imgbot will
re-encode and may shave a few KB per file. Don't add this directory
to `ignoredFiles`; we want imgbot's optimisations on these files too.
