# apps/studio — Production Sanity Studio

Production Sanity Studio deployed to sanity.io. See the root `.claude/CLAUDE.md` — **Sanity Studio — Dual Environment** section — for the authoritative dual-environment policy.

## Identity

| Field               | Value                      |
| ------------------- | -------------------------- |
| Project ID          | `vhb33jaz`                 |
| Dataset             | `production` (default)     |
| Deployment app ID   | `spu38xebdj9gax6q21ibckzf` |
| Staging counterpart | `apps/studio-staging`      |

## Where Things Live

- **Schemas** — defined in `packages/sanity-schemas`. Never add `defineType`/`defineField` here.
- **Studio UI customizations** (Document Actions, custom inputs, structure fragments, validators) — defined in `packages/sanity-studio`. Do not add Document Actions or general Studio UI React components to `apps/studio`; those belong in `packages/sanity-studio`.
- **App-level wiring** — `sanity.config.ts` and `structure.ts` assemble the above into a runnable Studio. This is the only place those packages are composed together.

## sanity.config.ts Rules

- Import `schemaTypes` from `./schemaTypes` (which re-exports from `@kcvv/sanity-studio`)
- Import the `structure` resolver from `./structure`
- Register Document Actions via `document.actions` — always spread `prev` first: `(prev) => [...prev, MyAction]`
- Dataset is read from `SANITY_STUDIO_DATASET` env var with `'production'` as fallback — do not hardcode it

## structure.ts Conventions

- Import structure fragments from `@kcvv/sanity-studio` (`staffStructure`, `responsibilityStructure`, …)
- Use `S.divider()` to group related document types visually
- Singleton documents (e.g. `homePage`, `jeugdLandingPage`) use `.document().schemaType().documentId()` — the `documentId` must match the singleton `_id` in the dataset
- Keep the sidebar order stable — reordering changes the editor UX for content editors

## .env.local

Required variables:

```env
SANITY_STUDIO_DATASET=production
```

`.env.local` is gitignored. Never commit secrets or dataset overrides. Copy `.env.example` (if present) as a starting point.

## Typegen

`sanity.cli.ts` points typegen output at `apps/web/src/lib/sanity/sanity.types.ts`. Run after any schema or GROQ query change:

```bash
pnpm --filter @kcvv/studio typegen
```

Commit the updated `sanity.types.ts` alongside the schema change. **CI enforces this** (`.github/workflows/ci.yml`, the "Sanity types in sync" step in `quality-checks`): it regenerates the types and fails the build if that produces a diff, so a forgotten regeneration is caught on the PR, not discovered later (#2862).

## Migrations

One-off data migrations live in `apps/studio/migrations/`. A migration with logic lives in `@kcvv/sanity-studio/migrations` with a test, and its `index.ts` here only re-exports it. Six older migrations still hold logic in place; [#3153](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3153) moves them. Do not copy one as a pattern.

Dry-run first. The CLI dry-runs by default, so this changes nothing:

```bash
npx sanity@latest migration run <name> --project vhb33jaz --dataset <staging|production>
```

Then apply with `--no-dry-run` (add `--no-confirm` when non-interactive). Run against staging first, then production. Document the migration as a manual step in the PR body.

- **Always pass `--dataset`.** Both `apps/studio/sanity.cli.ts` **and** `apps/studio-staging/sanity.cli.ts` default to `production`. Running from the staging folder does not pick the staging dataset.
- **Every migration has a facade in both folders** — `apps/studio/migrations/<name>/` and `apps/studio-staging/migrations/<name>/`, differing only in the docblock. A migration in one folder only is drift ([#3120](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3120)). **One temporary exception:** `title-portable-text-to-string` has no staging facade yet; [#3153](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3153) adds it. Being rollback-only is not an exemption — its own docblock targets staging.
- **The folders are not a run ledger.** Sanity records no history of which migration ran against which dataset. To know, dry-run it against both datasets and query the data for the old shape — zero patches on staging can mean "no such documents" rather than "already ran".
- **`title-portable-text-to-string` is rollback-only.** Never run it as a sync: it flattens every article title backwards.

## Dev / Deploy Workflow

```bash
# Local dev server (hot-reload)
pnpm --filter @kcvv/studio dev

# Deploy to sanity.io (production)
pnpm --filter @kcvv/studio deploy
```

`deploy` pushes to the hosted Studio at sanity.io — it does **not** deploy schemas or datasets.

## Sync With Staging

`apps/studio-staging` is the staging counterpart. `sanity.config.ts` and `structure.ts` in both apps must stay in sync. When editing either file here, apply the equivalent change to `apps/studio-staging` in the same PR or a follow-up before merging. See issue #1462 for the sync-tracking work.

## No Duplication With Root CLAUDE.md

This file covers app-local concerns. For monorepo-wide conventions (TypeScript compiler setup, commit style, PR workflow, Turborepo tasks), see `.claude/CLAUDE.md`.
