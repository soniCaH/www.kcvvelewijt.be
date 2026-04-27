# sanity-studio Package

Studio UI layer consumed by both `apps/studio` (production) and `apps/studio-staging`. See the root `.claude/CLAUDE.md` — **Sanity Studio — Dual Environment** section — for the authoritative dual-environment policy.

## Boundary: sanity-studio vs sanity-schemas

| Concern                                                                     | Lives in                        |
| --------------------------------------------------------------------------- | ------------------------------- |
| Schema definitions (`defineType`, `defineField`)                            | `packages/sanity-schemas`       |
| Document Actions, custom inputs, structure builders, validators, migrations | `packages/sanity-studio` ← here |

Never put `defineType`/`defineField` calls in non-schema packages. Do not add Document Actions or general Studio UI React components to `packages/sanity-schemas`. Small schema preview helpers (e.g. the existing `organigramNode-preview` utility) may remain in `packages/sanity-schemas` until they are migrated here.

## Key Rule: Every Change Ships to Both Studios

Editing any file here updates **both** `apps/studio` and `apps/studio-staging` simultaneously. Within `packages/sanity-studio`, there is no per-studio UI override. If a UI change requires feature-flagging, it must be expressed in the component logic itself (e.g. conditional on document type or env var), not by forking the package.

## Structure

```text
src/
├── actions/          ← Document Action components + their pure helpers
├── inputs/           ← Custom input components + apply-* registration helpers
├── migrations/       ← One-off data migration scripts (run manually via CLI)
├── preview/          ← previewSelect + prepare helpers shared with sanity-schemas
├── structure/        ← Structure builder fragments (desk sidebar ordering)
├── validation/       ← Custom Rule.custom() validators
├── schema-types.ts   ← Re-exports schemaTypes from @kcvv/sanity-schemas
└── index.ts          ← Barrel: everything exported by name
```

## Document Actions

- One Action per file in `src/actions/`
- Extract pure logic (mutation builders, queries) into a sibling `build-<action>-mutations.ts` — keeps the React component thin and the logic unit-testable
- Actions are registered in the studio `defineConfig` in `apps/studio/` and `apps/studio-staging/` — this package exports the component, the studio app wires it in
- Gate visibility with early-return null checks: `if (type !== 'staffMember') return null`

## Custom Inputs

- One input component per file in `src/inputs/`
- Pair each component with an `apply-<input>.ts` file that exports the `components` patch used in `defineField` — keeps registration decoupled from the component
- Export both the component and the apply helper from `src/inputs/index.ts`, then re-export from the package barrel

## Structure Builders

- One structure fragment per file in `src/structure/` (e.g. `staff.ts`, `responsibility.ts`)
- Export a single named function per file (`staffStructure`, `responsibilityStructure`)
- Structure fragments are composed in `apps/studio/` and `apps/studio-staging/` — do not import studio-app internals here

## Validators

- Same conventions as `packages/sanity-schemas/src/validation/` — pure functions, no async, exported from `src/validation/`
- When a validator is used by both a schema field and a Studio UI component, it lives here (not in sanity-schemas) so both packages can import it

## Preview Helpers

- `previewSelect` + `prepare` pairs in `src/preview/` — mirrored from sanity-schemas for Studio UI consumers that need them outside a schema definition

## Migrations

- One script per migration in `src/migrations/`
- Migrations are one-off: run manually via `sanity exec` against the target dataset, then archived (not deleted)
- Export a default function and any helper types from the migration file
- **Never re-export migrations from the root `src/index.ts` barrel.** Migrations import `sanity/migrate`, a Node/CLI-only entry point. With `autoUpdates: true`, the deployed Studio resolves it via `modules.sanity-cdn.com/.../bare/migrate.mjs`, which 404s and crashes both deployed studios with a black screen. Surface migrations through the dedicated `src/migrations/index.ts` sub-barrel and consume them via `@kcvv/sanity-studio/migrations` (the CLI entry points in `apps/studio/migrations/*` already do this)

## Barrel Export Pattern (`index.ts`)

Everything public is exported by name from `src/index.ts`. Rules:

- Export the component and its registration helper separately (`ArticleTagsInput` + `applyArticleTagsInput`)
- Export types with `export type { ... }` to avoid runtime leakage
- No default exports from the barrel — named only
- **Migrations are an exception**: they live in the separate `src/migrations/index.ts` sub-barrel (consumed as `@kcvv/sanity-studio/migrations`). See the **Migrations** section below for why mixing them into the root barrel breaks the deployed Studio

## No Duplication With Root CLAUDE.md

This file covers package-local concerns. For monorepo-wide conventions (TypeScript compiler setup, commit style, PR workflow, Turborepo tasks), see `.claude/CLAUDE.md`.
