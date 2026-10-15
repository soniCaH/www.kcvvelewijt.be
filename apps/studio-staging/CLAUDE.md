# apps/studio-staging — Staging Sanity Studio

Staging Sanity Studio deployed to sanity.io. Near-mirror of `apps/studio` (production) but pointed at the staging dataset. See the root `.claude/CLAUDE.md` — **Sanity Studio — Dual Environment** section — for the authoritative dual-environment policy.

## Identity

| Field                  | Value                               |
| ---------------------- | ----------------------------------- |
| Project ID             | `vhb33jaz` (shared with production) |
| Dataset                | `staging` (hardcoded)               |
| Production counterpart | `apps/studio`                       |

## Where Things Live

- **Schemas and validation** — defined in `packages/sanity-schemas` (schema types in `packages/sanity-schemas/src/`, validation rules in `packages/sanity-schemas/src/validation/`). Never add `defineType`/`defineField` or validation logic here.
- **Studio UI customizations** (Document Actions, custom inputs, structure fragments) — defined in `packages/sanity-studio`. Never add React components here.
- **App-level wiring** — `sanity.config.ts` and `structure.ts` assemble the above into a runnable Studio. This is the only place those packages are composed together.

## sanity.config.ts — Hardcoded Dataset

The dataset is hardcoded to `'staging'`, so no env var or `.env` file can repoint it.

## structure.ts — Must Mirror Production

`structure.ts` must stay identical to `apps/studio/structure.ts`. When editing either file, apply the equivalent change to the other in the same PR. Drift between the two is tracked in issue #1462.

## Deploy Workflow

```bash
# Local dev server (hot-reload)
pnpm --filter @kcvv/studio-staging dev

# Deploy to sanity.io (staging)
pnpm --filter @kcvv/studio-staging run deploy
```

`deploy` pushes to the hosted Studio at sanity.io and uploads the schema and manifest. Never use bare `pnpm --filter @kcvv/studio-staging deploy` (pnpm's built-in).

## Migrations

`migrations/` mirrors `apps/studio/migrations/`: every migration has a facade in **both** folders. Adding or removing one here means doing the same there, in the same PR. A facade here may only re-export from `@kcvv/sanity-studio/migrations`. The rules, the run command, and the rollback-only exception live in `apps/studio/CLAUDE.md` → **Migrations**.

`sanity.cli.ts` here defaults to the **`staging`** dataset (#3210). Always pass `--dataset` to `sanity migration run` anyway — an explicit flag beats relying on either studio's default.

## No Duplication With Root CLAUDE.md

This file covers app-local concerns. For monorepo-wide conventions (TypeScript compiler setup, commit style, PR workflow, Turborepo tasks), see `.claude/CLAUDE.md`.
