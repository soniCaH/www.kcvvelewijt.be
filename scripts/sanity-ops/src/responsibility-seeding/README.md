# responsibility-seeding

One-off scripts that seeded the `responsibility` help-topic type (issue #910)
and repaired the two things the type rename's own migration got wrong: six
topics the migration never carried over (`restore-missing-responsibilities.ts`,
see #2839's context) and 40 stale `responsibilityPath` documents left behind
by it (`delete-legacy-responsibility-paths.ts`).

## Kept as spent — used as the seeding template

`restore-missing-responsibilities.ts`'s own docblock says the #910 type-rename
migration "was never run against production: 40 `responsibilityPath`
documents from March 2026 are still there" — that line describes the #910
migration, the reason this folder's two follow-up scripts exist, not
`restore-missing`/`delete-legacy` themselves. To avoid asserting either
reading, the current state was checked directly against production with a
plain unauthenticated GROQ read (Sanity's production dataset is publicly
readable) on 2026-09-21:

```text
count(*[_type == "responsibilityPath"])                              → 0
*[_type == "responsibility" && slug.current in [...6 restored slugs]
  && active == true].slug.current                                    → all 6 present
```

Zero legacy documents remain and all six restored topics are active in
production. `restore-missing` and `delete-legacy` have both already run to
completion there — there is nothing left for either to do. That alone does
not justify deleting the folder: `board-cleanup`, `staff-cleanup` and
`team-image-backfill` next to it are the same shape — one-off, dataset-wide
Sanity migrations that already finished their job — and all three are kept in
this repo rather than removed once spent. Deleting a working template is the
harder mistake to undo; keeping it costs nothing beyond a dependency bump
Renovate already handles.

Consequence of keeping it: the next seeding/cleanup script is scaffolded from
`../shared/sanity-client.ts` (both the safe-by-default `client` and the
explicit-opt-in `draftAwareClient`) and guard patterns, so those guards must
be correct on their own terms, not merely correct because of a client
default. See `../shared/draft-id.ts` and its use in
`restore-missing-responsibilities.ts`'s `foreign` check and
`delete-legacy-responsibility-paths.ts`'s `unexpected` check.

## Scripts

Run as `pnpm --filter @kcvv/sanity-ops responsibility:<name>`.

- `create-gc-node` — one-off: creates the `organigramNode-gerechtelijk-correspondent` node.
- `seed` — seeds the initial `responsibility` documents.
- `restore-missing` — recreates the six help topics the #910 type-rename migration
  never carried over from the legacy `responsibilityPath` documents.
- `delete-legacy` — deletes the legacy `responsibilityPath` documents, once
  `restore-missing` has run and the six topics are confirmed active.

Auth: `SANITY_API_TOKEN` (write token) or a logged-in
`~/.config/sanity/config.json`.
