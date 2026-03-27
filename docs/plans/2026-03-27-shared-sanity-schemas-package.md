# Shared Sanity Schemas Package

**Date:** 2026-03-27
**Status:** Approved

## Problem

`apps/studio/` and `apps/studio/staging/` duplicate all Sanity schema files. Every schema change must be applied twice. Staging has repeatedly drifted behind production (missing `archived` fields, `featuredOnHome`, `sponsor.tier`, `roleLabel`/`roleCode` rename, etc.). The drift is unintentional — there is no meaningful difference between the two studios' schemas.

## Goal

Single source of truth for all shared Sanity schema types. Both studios consume from a shared workspace package. Production-only content types remain local to `apps/studio/`.

## Architecture

### New package: `packages/sanity-schemas/` (`@kcvv/sanity-schemas`)

Pure TypeScript source exports — no compile step (same pattern as `@kcvv/api-contract`).

```
packages/sanity-schemas/
├── package.json       (name: @kcvv/sanity-schemas, private: true)
├── tsconfig.json
└── src/
    ├── index.ts       (named exports + sharedSchemaTypes array)
    ├── player.ts
    ├── team.ts
    ├── staffMember.ts
    ├── responsibilityPath.ts
    ├── article.ts
    ├── sponsor.ts
    ├── event.ts
    ├── page.ts
    ├── fileAttachment.ts
    ├── htmlTable.ts
    └── searchFeedback.ts
```

`package.json` exports:

```json
{
  "name": "@kcvv/sanity-schemas",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    }
  }
}
```

The source for each schema is taken from `apps/studio/schemaTypes/` (production = source of truth). Any fields that were missing in staging are included.

### Staging promoted: `apps/studio/staging/` → `apps/studio-staging/`

- Rename directory to `apps/studio-staging/`
- Rename package to `@kcvv/studio-staging` (resolves name collision with `@kcvv/studio`)
- Add `@kcvv/sanity-schemas: workspace:*` dependency
- Delete all duplicated `schemaTypes/*.ts` files
- Collapse `schemaTypes/index.ts` to:

```typescript
import { sharedSchemaTypes } from "@kcvv/sanity-schemas";
export const schemaTypes = sharedSchemaTypes;
```

`pnpm-workspace.yaml` already covers `apps/*` — no change needed.

### Production `apps/studio/` updated

- Add `@kcvv/sanity-schemas: workspace:*` dependency
- Delete the 11 shared schema files
- Keep only the 3 production-only types: `articleImage.ts`, `banner.ts`, `homePage.ts`
- Update `schemaTypes/index.ts`:

```typescript
import { sharedSchemaTypes } from "@kcvv/sanity-schemas";
import { articleImage } from "./articleImage";
import { banner } from "./banner";
import { homePage } from "./homePage";

export const schemaTypes = [
  ...sharedSchemaTypes,
  articleImage,
  banner,
  homePage,
];
```

### `turbo.json` updated

Add `@kcvv/sanity-schemas` as a dependency in the `@kcvv/studio#typegen` task so Turbo invalidates typegen when shared schemas change:

```json
"@kcvv/studio#typegen": {
  "dependsOn": ["@kcvv/sanity-schemas#type-check"],
  ...
}
```

## What stays out of scope

`structure.ts` duplication — Studio UI configuration, not schema data. Tackle separately.

## Schema source of truth during migration

Production files are canonical. Where staging differed (missing fields), the production version wins. The migration `rename-staff-position-fields` has already been applied to production schemas — shared package gets the post-migration field names (`roleLabel`, `roleCode`).
