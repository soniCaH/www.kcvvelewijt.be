# apps/studio-staging — Staging Sanity Studio

Staging Sanity Studio deployed to sanity.io. Near-mirror of `apps/studio` (production) but pointed at the staging dataset. See the root `.claude/CLAUDE.md` — **Sanity Studio — Dual Environment** section — for the authoritative dual-environment policy.

## Identity

| Field                  | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| Project ID             | `vhb33jaz` (shared with production)                       |
| Dataset                | Set via `SANITY_STUDIO_DATASET` env var — **no fallback** |
| Production counterpart | `apps/studio`                                             |

## Where Things Live

- **Schemas and validation** — defined in `packages/sanity-schemas` (schema types in `packages/sanity-schemas/src/`, validation rules in `packages/sanity-schemas/src/validation/`). Never add `defineType`/`defineField` or validation logic here.
- **Studio UI customizations** (Document Actions, custom inputs, structure fragments) — defined in `packages/sanity-studio`. Never add React components here.
- **App-level wiring** — `sanity.config.ts` and `structure.ts` assemble the above into a runnable Studio. This is the only place those packages are composed together.

## sanity.config.ts — Strict Env Handling

The staging config intentionally throws if `SANITY_STUDIO_DATASET` is not set:

```typescript
dataset: (() => {
  const ds = process.env.SANITY_STUDIO_DATASET as string | undefined
  if (!ds) throw new Error('SANITY_STUDIO_DATASET env var is required for the staging studio')
  return ds
})(),
```

Production uses a lenient fallback (`|| 'production'`). **Do not add a fallback here.** The strict guard prevents accidentally pointing the staging Studio at the production dataset when `.env.local` is missing.

## structure.ts — Must Mirror Production

`structure.ts` must stay identical to `apps/studio/structure.ts`. When editing either file, apply the equivalent change to the other in the same PR. Drift between the two is tracked in issue #1462.

## .env.local

Required variables:

```env
SANITY_STUDIO_DATASET=staging
```

`.env.local` is gitignored. The Studio will throw on startup if this is absent (see strict env handling above). Never commit secrets or dataset values.

## Deploy Workflow

```bash
# Local dev server (hot-reload)
pnpm --filter @kcvv/studio-staging dev

# Deploy to sanity.io (staging)
pnpm --filter @kcvv/studio-staging deploy
```

`deploy` pushes to the hosted Studio at sanity.io — it does **not** deploy schemas or datasets.

Note: when `sanity.cli.ts` does not declare an `appId`, `pnpm deploy` will prompt to create or supply one (a new hosted Studio deployment). Once an `appId` is set in `sanity.cli.ts`, subsequent deploys reuse that existing deployment. Align the staging `appId` with production once a stable staging deployment ID is established.

## No Duplication With Root CLAUDE.md

This file covers app-local concerns. For monorepo-wide conventions (TypeScript compiler setup, commit style, PR workflow, Turborepo tasks), see `.claude/CLAUDE.md`.
