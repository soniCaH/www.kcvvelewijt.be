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

## sanity.config.ts — "Voorbeeld" Origin

"Voorbeeld" (`createPreviewAction`) is registered exactly as in `apps/studio/sanity.config.ts`; only the web origin differs: `http://localhost:3000`, the web app run locally against the staging dataset (#3661). Known limit: the button works only while the web app runs locally on port 3000. Start the web app with `NEXT_PUBLIC_SANITY_DATASET=staging pnpm --filter @kcvv/web dev`: the web client defaults to the production dataset when the variable is unset. Never point it at the production site.

## structure.ts — Must Mirror Production

`structure.ts` must stay identical to `apps/studio/structure.ts`. When editing either file, apply the equivalent change to the other in the same PR.

## Deploy Workflow

```bash
# Local dev server (hot-reload)
pnpm --filter @kcvv/studio-staging dev

# Deploy to sanity.io (staging)
pnpm --filter @kcvv/studio-staging run deploy
```

`deploy` pushes to the hosted Studio at sanity.io and uploads the schema and manifest. Never use bare `pnpm --filter @kcvv/studio-staging deploy` (pnpm's built-in).

Staging has no CI deploy: run it by hand (it goes to https://kcvv-elewijt-staging.sanity.studio). Deploy reads the schema packages from source, so run it from a checkout that has the merged schema change (for example `main`), not from whatever branch you are on.

## Migrations

`migrations/` mirrors `apps/studio/migrations/`: every migration has a facade in **both** folders. Adding or removing one here means doing the same there, in the same PR. A facade here may only re-export from `@kcvv/sanity-studio/migrations`. The rules, the run command, and the rollback-only exception live in `apps/studio/CLAUDE.md` → **Migrations**.

`sanity.cli.ts` here defaults to the **`staging`** dataset (#3210). Always pass `--dataset` to `sanity migration run` anyway — an explicit flag beats relying on either studio's default.

**No `let`** — lint rule `kcvv/no-let` (`eslint.config.mjs`, #3717), tests included. A `let` + `try/catch` becomes a helper that returns; a counter becomes `reduce`/`map`; shared state in a test is a `const` holder object.

## No Duplication With Root CLAUDE.md

This file covers app-local concerns. For monorepo-wide conventions (TypeScript compiler setup, commit style, PR workflow, Turborepo tasks), see `.claude/CLAUDE.md`.
