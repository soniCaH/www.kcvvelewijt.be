# responsibility-seeding

One-off scripts that seeded the `responsibility` help-topic type (issue #910)
and repaired the two things the type rename's own migration got wrong: six
topics the migration never carried over (`restore-missing-responsibilities.ts`,
see #2839's context) and 40 stale `responsibilityPath` documents left behind
by it (`delete-legacy-responsibility-paths.ts`).

## Kept as spent — used as the seeding template

All of this package's scripts have already run to completion on both
datasets; there is nothing left for any of them to do. That alone does not
justify deleting the package: `scripts/board-cleanup`, `scripts/staff-cleanup`
and `scripts/team-image-backfill` are the same shape — one-off, dataset-wide
Sanity migrations that already finished their job — and all three are kept in
this repo rather than removed once spent. Deleting a working template is the
harder mistake to undo; keeping it costs nothing beyond a dependency bump
Renovate already handles.

Consequence of keeping it: the next seeding/cleanup script is scaffolded from
this package's `sanity-client.ts` and guard patterns, so those guards must be
correct on their own terms, not merely correct because of a client default.
See `src/draft-id.ts` and its use in `restore-missing-responsibilities.ts`'s
`foreign` check.

## Scripts

- `create-gc-node` — one-off: creates the `organigramNode-gerechtelijk-correspondent` node.
- `seed` — seeds the initial `responsibility` documents.
- `restore-missing` — recreates the six help topics the #910 type-rename migration
  never carried over from the legacy `responsibilityPath` documents.
- `delete-legacy` — deletes the legacy `responsibilityPath` documents, once
  `restore-missing` has run and the six topics are confirmed active.

Auth: `SANITY_API_TOKEN` (write token) or a logged-in
`~/.config/sanity/config.json`.
