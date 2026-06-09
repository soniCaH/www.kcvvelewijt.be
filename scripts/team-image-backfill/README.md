# team-image-backfill

One-time recovery of team squad photos (`team.teamImage`) from the legacy Drupal
site into Sanity. See issue #2070.

`team.teamImage` is an editorial field — PSD sync never populates it, and the
original Drupal → Sanity migration missed it, so every team shipped without a
photo. The photos still exist in Drupal (`node/team` →
`field_media_article_image`) and this script recovers them.

## How matching works

- **Seniors** (`A-Ploeg` / `B-Ploeg`) and any ambiguous youth band are matched
  via the explicit `SLUG_OVERRIDES` map in `src/backfill-team-images.ts`.
- **Youth** are matched dynamically by age token (`U17`, `U13`, …). A band that
  resolves to more than one current team (today: `U7` = groen/wit, `U9` =
  wit/groen/U9P) is reported as **unmatched** — never guessed. Add a
  `SLUG_OVERRIDES` line once the target team is decided, then re-run.
- Teams that already have a `teamImage` are skipped (idempotent). `--force`
  overwrites.

## Run

```bash
npm install

# 1. Dry-run — prints the match plan, writes nothing.
SANITY_DATASET=staging npm run backfill -- --dry-run

# 2. Apply to staging.
SANITY_DATASET=staging npm run backfill

# 3. Apply to production (guarded — both vars required).
SANITY_DATASET=production SANITY_ALLOW_PRODUCTION=1 npm run backfill
```

Auth: `SANITY_API_TOKEN` (write token) or a logged-in
`~/.config/sanity/config.json`.
