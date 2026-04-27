# sanity-schemas Package

Shared Sanity schema definitions consumed by both `apps/studio` (production) and `apps/studio-staging`. See the root `.claude/CLAUDE.md` — **Sanity Studio — Dual Environment** section — for the authoritative dual-environment policy.

## Key Rule: Every Change Ships to Both Studios

Editing any file here updates **both** `apps/studio` and `apps/studio-staging` simultaneously. There is no per-studio schema override. If a schema change requires a data migration, the migration must run in both environments before merging.

## Structure

```text
src/
├── <schema>.ts          ← one file per document/object type
├── preview/             ← previewSelect + prepare helpers (one file per schema that needs them)
├── validation/          ← custom Rule.custom() validators (one file per validator)
└── index.ts             ← barrel: named exports + schemaTypes array
```

## Scaffold From a Peer

Before writing a new schema, open the nearest peer schema and mirror its shape. Recommended reference for:

- **Document types**: `article.ts` — shows orderings, field groups, validation, hidden conditions
- **Object types embedded in arrays**: `subject.ts`, `transferFact.ts`
- **PSD-synced documents (readOnly fields)**: `player.ts`

One grep of `defineType` across the peers prevents the most common review flags.

## Field Naming Conventions

- `camelCase` for all field names (`publishedAt`, `articleType`, `firstName`)
- Titles are sentence-cased (`"Article type"`, `"Published at"`)
- Boolean fields use affirmative names (`featured`, `archived`, `keeper`) with `initialValue` set where a sensible default exists
- Date/time fields: use `datetime` for moments, `date` for calendar dates (no time component)

### Image Field Semantic Prefixes

Image fields use semantic prefixes that reflect the content's role — not a generic name like `image` or `mainImage`. Use the closest match from this canonical list:

| Prefix             | Role                                                               | Used in                                       |
| ------------------ | ------------------------------------------------------------------ | --------------------------------------------- |
| `coverImage`       | Editorial content image (article, event)                           | `article`, `event`                            |
| `heroImage`        | Generic page banner                                                | `page`                                        |
| `teamImage`        | Team squad photo                                                   | `team`                                        |
| `logo`             | Brand mark                                                         | `sponsor`                                     |
| `photo`            | Person portrait                                                    | `staffMember`                                 |
| `psdImage`         | Rectangular player photo — synced from PSD, do not edit            | `player`                                      |
| `transparentImage` | Transparent-background player photo — synced from PSD, do not edit | `player`                                      |
| `ogImage`          | Open Graph image override (optional, on all document types)        | `article`, `event`, `page`, `team`, `sponsor` |

New schemas must adopt the closest semantic match from this list. Never invent a new generic name.

## Validation Rules

- Every required field carries `validation: (r) => r.required()`
- Complex cross-field rules go in `src/validation/<name>.ts`, exported from `index.ts`, and imported where used
- Keep validators pure functions — no side effects, no async

## Preview Blocks

- If a schema's preview requires a `prepare` transform, extract both `previewSelect` and `prepare` into `src/preview/<schema>-preview.ts`
- Simple previews (select only, no transform) can be inlined directly in `defineType`

## Descriptions

- Write `description` for any field whose purpose or constraints aren't obvious from name + type
- Write descriptions in Dutch when they are editor-facing UI copy; write in English for developer-facing intent

## Documents vs Objects

- `type: "document"` — top-level content a Studio user creates/manages directly (article, player, team, sponsor, event, page…)
- `type: "object"` — embedded value types used as array items or nested fields (subject, transferFact, eventFact…); never appear as standalone Studio documents

## Barrel Export Pattern (`index.ts`)

`index.ts` has two responsibilities:

1. **Named exports** — every schema, preview helper, validator, and type is exported by name so consumers can import selectively
2. **`schemaTypes` array** — the ordered array passed to `defineConfig({ schema: { types: schemaTypes } })` in both studios

When adding a new schema:

1. Add the named export at the top of `index.ts`
2. Add the import below the exports block
3. Append the schema to `schemaTypes`

Keep `schemaTypes` order stable — reordering changes Studio sidebar ordering for editors.

## Migration Script Expectations

When renaming or restructuring a field (not just adding a new optional one), a Sanity migration script is required:

- Place migration scripts in `apps/studio/migrations/<migration-name>/index.ts` — they run against the dataset, not a package concern
- Reference the migration in the PR body and list it as a manual step
- Run staging migration before merging; production migration before or immediately after deploy

### Running a Migration

```bash
# Dry-run on staging (review patch output, no writes)
npx sanity@latest migration run <migration-name> --dataset=staging --dry-run

# Run on staging
npx sanity@latest migration run <migration-name> --dataset=staging

# Run on production (after staging is verified)
npx sanity@latest migration run <migration-name> --dataset=production
```

Migrations must be idempotent: re-running them on already-migrated documents must be a no-op.

## No Duplication With Root CLAUDE.md

This file covers package-local concerns. For monorepo-wide conventions (TypeScript compiler setup, commit style, PR workflow, Turborepo tasks), see `.claude/CLAUDE.md`.
