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
  overwrites — on production it also needs `CONFIRM_PRODUCTION_TEAM_IMAGE_FORCE_OVERWRITE=yes`.

## Run

```bash
# 1. Dry run (the default) — prints the match plan, writes nothing.
SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops team-image:backfill

# 2. Apply to staging.
SANITY_DATASET=staging pnpm --filter @kcvv/sanity-ops team-image:backfill --execute

# 3. Apply to production (guarded).
SANITY_DATASET=production CONFIRM_PRODUCTION_TEAM_IMAGE_BACKFILL=yes pnpm --filter @kcvv/sanity-ops team-image:backfill --execute

# 4. Overwrite existing photos on production (strict confirm; editors have
#    added photos since the 2026 production backfill).
SANITY_DATASET=production CONFIRM_PRODUCTION_TEAM_IMAGE_BACKFILL=yes CONFIRM_PRODUCTION_TEAM_IMAGE_FORCE_OVERWRITE=yes pnpm --filter @kcvv/sanity-ops team-image:backfill --execute --force
```

Auth: `SANITY_API_TOKEN` (write token) or a logged-in
`~/.config/sanity/config.json`.
