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
├── templates/        ← LauncherTemplate manifests grouped per schema type
├── tools/            ← Studio Tools (top-nav tabs); one folder per Tool
│   └── launcher/     ← LauncherTool — `✨ Create` card grid (#1499)
├── validation/       ← Custom Rule.custom() validators
├── schema-types.ts   ← Re-exports schemaTypes from @kcvv/sanity-schemas
└── index.ts          ← Barrel: everything exported by name
```

## Document Actions

- One Action per file in `src/actions/`
- Extract pure logic (mutation builders, queries) into a sibling `build-<action>-mutations.ts` — keeps the React component thin and the logic unit-testable
- Actions are registered in the studio `defineConfig` in `apps/studio/` and `apps/studio-staging/` — this package exports the component, the studio app wires it in
- Gate visibility with early-return null checks: `if (type !== 'staffMember') return null`

## Tools (top-nav tabs)

Custom Studio Tools live under `src/tools/<name>/`. Each Tool exports:

- A factory function (`<name>Tool()`) returning a Sanity `Tool` object — wired in both `apps/studio/sanity.config.ts` and `apps/studio-staging/sanity.config.ts` via `tools: (prev) => [...prev, <name>Tool()]`.
- A root React component (`<Name>Tool`) referenced by the factory's `component` field.
- Sub-components (cards, grids, etc.) kept pure where possible — receive data via props, dispatch intent via `useRouter()` from `sanity/router` only at the root.

### LauncherTool — `tools/launcher/`

The `✨ Create` card grid in the top nav. Reads launcher-eligible templates from the workspace via `useTemplates()` and dispatches `router.navigateIntent('create', { type, template })` when an editor picks a card. Sanity routes the intent to a new draft seeded by the template's `value`.

**When a doc type earns a launcher card (IVT):** add one only when there is **shape variation worth seeding** — a field whose value changes which groups/fields the form shows (e.g. `article`'s `articleType` → 4 cards), or a single zero-prefill card that is the teaching on-ramp for a hand-created type (e.g. `responsibility`). **Skip** singletons (`homePage`, `jeugdLandingPage`) and data-driven / rarely-created types (`matchPreview`/`matchRecap` are generated from match data) — those keep working through Sanity's default `+ Create` button.

**Adding a launcher card** for an existing schema type:

1. Create or edit `src/templates/<schemaType>-templates.ts` and export a `<schemaType>Templates: LauncherTemplate[]` constant. Each entry needs `id`, `title`, `schemaType`, `value` (zero-prefill `{}` unless seeding form-shape fields like `articleType` — per design decision D6, **never** prefill editorial content), and a `ui` block (`icon`, Dutch ≤100-char `description`, `group`).
2. Re-export the manifest from `src/templates/index.ts`, **append it to the `launcherTemplates` aggregate** in that same file, and re-export it from the package barrel.
3. **No `sanity.config.ts` edit.** Both studios register the grid once via `schema.templates: (prev) => [...prev, ...launcherTemplates]`, so appending to the aggregate (step 2) is the only registration step.

The `ui.icon` is a **Lucide icon name string** (kebab-case, e.g. `'mic'`, `'help-circle'`, `'arrow-left-right'`) — the same vocabulary the public site uses. It is currently stored on the template but not yet rendered on the card (the icon slot lands with the icon-name registry); set it correctly now so cards light up when it ships. Do **not** use `@sanity/icons` PascalCase component names here — those are for Tool/Action `icon` slots (e.g. `launcherTool`'s `ComposeSparklesIcon`), not the launcher card `ui.icon`.

**Filtering rules** (enforced by `filterLauncherTemplates`):

- Templates without a `ui` block are ignored — Sanity's auto-generated and third-party templates still work via the default `+ Create` button. Coexistence is the design contract.
- Templates whose `schemaType` is not registered in the workspace schema are ignored and a single console warning is logged per unknown type per render.

The pure filter (`filterLauncherTemplates`) lives in its own file separate from the React hook so vitest can import it without dragging Sanity's runtime CSS bundle into the module graph. Keep new pure helpers in their own files for the same reason.

## Custom Inputs

- One input component per file in `src/inputs/`
- Pair each component with an `apply-<input>.ts` helper that takes `schemaTypes` and returns a copy with the component grafted onto a specific field's `components.input` — non-mutating, a safe no-op when the target type/field is absent. This keeps `@kcvv/sanity-schemas` React-free: the schema declares a plain field, the graft happens in `src/schema-types.ts` where all `apply-*` helpers compose (`applyRespondentPicker(applyArticleTagsInput(baseSchemaTypes, …), …)`).
- Export both the component and the apply helper from `src/inputs/index.ts`, then re-export from the package barrel

**Person / contact references:** reuse **`RespondentPicker`** instead of a raw `reference` input. It is grafted onto the target field via `applyRespondentPicker` in `schema-types.ts` (see above) — the schema keeps a plain field, so no React leaks into `@kcvv/sanity-schemas` and no per-studio config edit is needed.

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

## Editor-UX Rework — Adding a New Doc Type (Checklist)

Used verbatim by the Phase 5+ propagation issues (#1503–#1511, #2181). Everything below lands **once** in `@kcvv/sanity-schemas` / `@kcvv/sanity-studio` and applies to **both** studios — there is **no** per-studio `sanity.config.ts` step. Copy the shipped `responsibility` / `article` types as the reference.

**Schema** (`packages/sanity-schemas/src/<type>.ts` — see that package's CLAUDE.md "Editor-UX Convention"):

1. [ ] Declare `groups` with exactly one `default: true`; assign every field a `group`.
2. [ ] Give every non-obvious field a 1–3 sentence Dutch teaching `description` (what + concrete example + public-site impact).
3. [ ] Give every `Rule.required()` a teaching `.error('Verplicht. …')` stating what breaks on the site without it.
4. [ ] For person/contact references, leave the field plain — it gets the `RespondentPicker` graft (step 6), not a raw `reference` input.

**Studio** (`packages/sanity-studio/`):

5. [ ] **Launcher card (only if earned):** if the type has shape variation worth seeding (or is a hand-created singleton-on-ramp), add `src/templates/<type>-templates.ts`, re-export it from `src/templates/index.ts`, **append it to the `launcherTemplates` aggregate**, and re-export from the barrel. `value` seeds only form-shape fields (never editorial content); `ui.icon` is a Lucide name string. Skip for singletons / data-driven types.
6. [ ] **Custom inputs (if any):** graft via an `apply-<input>.ts` helper composed in `src/schema-types.ts` (reuse `RespondentPicker` for contacts). Schema stays React-free.

**Verify:**

7. [ ] `pnpm --filter @kcvv/sanity-studio check-all` and `pnpm --filter @kcvv/studio check-all` pass.
8. [ ] Manual smoke against the staging dataset: create the type (via launcher if it has a card), confirm groups/descriptions/errors render, publish.

## No Duplication With Root CLAUDE.md

This file covers package-local concerns. For monorepo-wide conventions (TypeScript compiler setup, commit style, PR workflow, Turborepo tasks), see `.claude/CLAUDE.md`.
