# Shared Sanity Schemas Package — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract all shared Sanity schema types into `packages/sanity-schemas` so both studios consume a single source of truth.

**Architecture:** New private workspace package `@kcvv/sanity-schemas` exports all 14 schema types as raw TypeScript source (no build step, same pattern as `@kcvv/api-contract`). Both studios consume only the package — no local schema files remain. Staging directory moves from `apps/studio/staging/` to `apps/studio-staging/` to become a proper workspace member.

**Tech Stack:** Sanity v5, pnpm workspaces, Turborepo, TypeScript strict

---

## Key facts before you start

- `apps/studio/` = production studio (`@kcvv/studio`) — source of truth for all schemas
- `apps/studio/staging/` = staging studio — currently NOT a workspace member, will be promoted
- `packages/` is already in `pnpm-workspace.yaml` — the new package is auto-discovered
- `apps/*` glob covers `apps/studio-staging/` once we move it — `pnpm-workspace.yaml` needs no change
- `article.ts` references `{type: 'articleImage'}` — `articleImage` must be in the shared package
- All 14 types go into the shared package — no production-only schemas
- `team.ts` exports two named exports: `trainingDay` and `team`
- Staging `sanity.config.ts` requires `SANITY_STUDIO_DATASET` env var — set it when running staging commands

---

## Task 1: Create `packages/sanity-schemas` scaffold

**Files:**

- Create: `packages/sanity-schemas/package.json`
- Create: `packages/sanity-schemas/tsconfig.json`
- Create: `packages/sanity-schemas/src/index.ts`

**Step 1: Create `package.json`**

```json
{
  "name": "@kcvv/sanity-schemas",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    }
  },
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "peerDependencies": {
    "sanity": ">=5"
  },
  "devDependencies": {
    "sanity": "5.18.0",
    "typescript": "5.9.3"
  }
}
```

**Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "Preserve",
    "moduleDetection": "force",
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

**Step 3: Create empty `src/index.ts`**

```typescript
// populated in Task 2
export const schemaTypes: unknown[] = [];
```

**Step 4: Register the package with pnpm**

```bash
pnpm install
```

Expected: pnpm symlinks `@kcvv/sanity-schemas` into `node_modules`. No errors.

**Step 5: Commit**

```bash
git add packages/sanity-schemas/
git commit -m "feat(schema): scaffold @kcvv/sanity-schemas package"
```

---

## Task 2: Populate shared schemas in the package

Copy all 14 schema files from `apps/studio/schemaTypes/` into `packages/sanity-schemas/src/`. These are the canonical production versions.

**Files to copy (14 files):**

| Source                                          | Destination                                         |
| ----------------------------------------------- | --------------------------------------------------- |
| `apps/studio/schemaTypes/player.ts`             | `packages/sanity-schemas/src/player.ts`             |
| `apps/studio/schemaTypes/team.ts`               | `packages/sanity-schemas/src/team.ts`               |
| `apps/studio/schemaTypes/staffMember.ts`        | `packages/sanity-schemas/src/staffMember.ts`        |
| `apps/studio/schemaTypes/responsibilityPath.ts` | `packages/sanity-schemas/src/responsibilityPath.ts` |
| `apps/studio/schemaTypes/article.ts`            | `packages/sanity-schemas/src/article.ts`            |
| `apps/studio/schemaTypes/articleImage.ts`       | `packages/sanity-schemas/src/articleImage.ts`       |
| `apps/studio/schemaTypes/sponsor.ts`            | `packages/sanity-schemas/src/sponsor.ts`            |
| `apps/studio/schemaTypes/event.ts`              | `packages/sanity-schemas/src/event.ts`              |
| `apps/studio/schemaTypes/page.ts`               | `packages/sanity-schemas/src/page.ts`               |
| `apps/studio/schemaTypes/fileAttachment.ts`     | `packages/sanity-schemas/src/fileAttachment.ts`     |
| `apps/studio/schemaTypes/htmlTable.ts`          | `packages/sanity-schemas/src/htmlTable.ts`          |
| `apps/studio/schemaTypes/searchFeedback.ts`     | `packages/sanity-schemas/src/searchFeedback.ts`     |
| `apps/studio/schemaTypes/banner.ts`             | `packages/sanity-schemas/src/banner.ts`             |
| `apps/studio/schemaTypes/homePage.ts`           | `packages/sanity-schemas/src/homePage.ts`           |

**Step 1: Copy the files**

```bash
cp apps/studio/schemaTypes/player.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/team.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/staffMember.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/responsibilityPath.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/article.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/articleImage.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/sponsor.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/event.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/page.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/fileAttachment.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/htmlTable.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/searchFeedback.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/banner.ts packages/sanity-schemas/src/
cp apps/studio/schemaTypes/homePage.ts packages/sanity-schemas/src/
```

**Step 2: Replace `src/index.ts` with full exports**

```typescript
export { player } from "./player";
export { team, trainingDay } from "./team";
export { staffMember } from "./staffMember";
export { responsibilityPath } from "./responsibilityPath";
export { article } from "./article";
export { articleImage } from "./articleImage";
export { sponsor } from "./sponsor";
export { event } from "./event";
export { page } from "./page";
export { fileAttachment } from "./fileAttachment";
export { htmlTable } from "./htmlTable";
export { searchFeedback } from "./searchFeedback";
export { banner } from "./banner";
export { homePage } from "./homePage";

import { player } from "./player";
import { team, trainingDay } from "./team";
import { staffMember } from "./staffMember";
import { responsibilityPath } from "./responsibilityPath";
import { article } from "./article";
import { articleImage } from "./articleImage";
import { sponsor } from "./sponsor";
import { event } from "./event";
import { page } from "./page";
import { fileAttachment } from "./fileAttachment";
import { htmlTable } from "./htmlTable";
import { searchFeedback } from "./searchFeedback";
import { banner } from "./banner";
import { homePage } from "./homePage";

export const schemaTypes = [
  player,
  team,
  trainingDay,
  staffMember,
  responsibilityPath,
  article,
  articleImage,
  sponsor,
  event,
  page,
  fileAttachment,
  htmlTable,
  searchFeedback,
  banner,
  homePage,
];
```

**Step 3: Type-check the package**

```bash
pnpm --filter @kcvv/sanity-schemas type-check
```

Expected: no errors.

**Step 4: Commit**

```bash
git add packages/sanity-schemas/src/
git commit -m "feat(schema): populate shared schema types in @kcvv/sanity-schemas"
```

---

## Task 3: Update production studio to consume the package

**Files:**

- Modify: `apps/studio/package.json`
- Modify: `apps/studio/schemaTypes/index.ts`
- Delete: 14 schema files now in the shared package

**Step 1: Add workspace dependency to production studio**

In `apps/studio/package.json`, add to `dependencies`:

```json
"@kcvv/sanity-schemas": "workspace:*"
```

**Step 2: Replace `apps/studio/schemaTypes/index.ts`**

```typescript
export { schemaTypes } from "@kcvv/sanity-schemas";
```

**Step 3: Delete the 14 files now owned by the package**

```bash
rm apps/studio/schemaTypes/player.ts
rm apps/studio/schemaTypes/team.ts
rm apps/studio/schemaTypes/staffMember.ts
rm apps/studio/schemaTypes/responsibilityPath.ts
rm apps/studio/schemaTypes/article.ts
rm apps/studio/schemaTypes/articleImage.ts
rm apps/studio/schemaTypes/sponsor.ts
rm apps/studio/schemaTypes/event.ts
rm apps/studio/schemaTypes/page.ts
rm apps/studio/schemaTypes/fileAttachment.ts
rm apps/studio/schemaTypes/htmlTable.ts
rm apps/studio/schemaTypes/searchFeedback.ts
rm apps/studio/schemaTypes/banner.ts
rm apps/studio/schemaTypes/homePage.ts
```

**Step 4: Install and build**

```bash
pnpm install
pnpm --filter @kcvv/studio build
```

Expected: Sanity builds the production studio to `apps/studio/dist/` without errors.

**Step 5: Commit**

```bash
git add apps/studio/
git commit -m "feat(schema): production studio consumes @kcvv/sanity-schemas"
```

---

## Task 4: Promote staging to `apps/studio-staging/`

**Step 1: Move the directory**

```bash
git mv apps/studio/staging apps/studio-staging
```

**Step 2: Rename the package**

In `apps/studio-staging/package.json`, change `"name"`:

```json
"name": "@kcvv/studio-staging"
```

Also add `@kcvv/sanity-schemas` to `dependencies` and bump sanity to match production:

```json
"dependencies": {
  "@kcvv/sanity-schemas": "workspace:*",
  "@sanity/icons": "3.7.4",
  "@sanity/vision": "5.18.0",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "sanity": "5.18.0",
  "styled-components": "6.3.12"
}
```

**Step 3: Delete all duplicated schema files**

```bash
rm apps/studio-staging/schemaTypes/player.ts
rm apps/studio-staging/schemaTypes/team.ts
rm apps/studio-staging/schemaTypes/staffMember.ts
rm apps/studio-staging/schemaTypes/responsibilityPath.ts
rm apps/studio-staging/schemaTypes/article.ts
rm apps/studio-staging/schemaTypes/sponsor.ts
rm apps/studio-staging/schemaTypes/event.ts
rm apps/studio-staging/schemaTypes/page.ts
rm apps/studio-staging/schemaTypes/fileAttachment.ts
rm apps/studio-staging/schemaTypes/htmlTable.ts
rm apps/studio-staging/schemaTypes/searchFeedback.ts
```

**Step 4: Replace `apps/studio-staging/schemaTypes/index.ts`**

```typescript
export { schemaTypes } from "@kcvv/sanity-schemas";
```

**Step 5: Install and build staging**

```bash
pnpm install
SANITY_STUDIO_DATASET=staging pnpm --filter @kcvv/studio-staging build
```

Expected: Sanity builds staging studio without errors.

**Step 6: Verify the old path is gone**

```bash
ls apps/studio/staging 2>/dev/null && echo "ERROR: old path still exists" || echo "OK: old path removed"
```

Expected: `OK: old path removed`

**Step 7: Commit**

```bash
git add apps/studio-staging/ apps/studio/staging
git commit -m "feat(schema): promote staging to apps/studio-staging, consume @kcvv/sanity-schemas"
```

---

## Task 5: Update `turbo.json` for cache invalidation

The `@kcvv/studio#typegen` task generates `apps/web/src/lib/sanity/sanity.types.ts`. Its inputs must include the shared package source so Turbo invalidates the cache when shared schemas change.

**Files:**

- Modify: `turbo.json`

**Step 1: Update the typegen task inputs**

Find this block in `turbo.json`:

```json
"@kcvv/studio#typegen": {
  "outputs": ["../web/src/lib/sanity/sanity.types.ts", "schema.json"],
  "inputs": [
    "schemaTypes/**",
    "sanity.cli.ts",
    "../web/src/lib/repositories/*.ts"
  ]
}
```

Replace with:

```json
"@kcvv/studio#typegen": {
  "outputs": ["../web/src/lib/sanity/sanity.types.ts", "schema.json"],
  "inputs": [
    "schemaTypes/**",
    "sanity.cli.ts",
    "../web/src/lib/repositories/*.ts",
    "../../packages/sanity-schemas/src/**"
  ]
}
```

**Step 2: Commit**

```bash
git add turbo.json
git commit -m "feat(config): invalidate typegen cache when shared sanity schemas change"
```

---

## Task 6: Final end-to-end verification

**Step 1: Clean install from root**

```bash
pnpm install
```

Expected: no errors, `@kcvv/sanity-schemas` symlinked in both studios' `node_modules`.

**Step 2: Type-check the full monorepo**

```bash
pnpm turbo type-check
```

Expected: all packages pass. (Note: `@kcvv/studio` and `@kcvv/studio-staging` don't have a `type-check` turbo task — this is fine, they are validated by `sanity build` in the next step.)

**Step 3: Build production studio**

```bash
pnpm --filter @kcvv/studio build
```

Expected: build succeeds, no unknown type errors.

**Step 4: Build staging studio**

```bash
SANITY_STUDIO_DATASET=staging pnpm --filter @kcvv/studio-staging build
```

Expected: build succeeds.

**Step 5: Verify no schema files remain in `apps/studio/schemaTypes/` except the thin re-export**

```bash
ls apps/studio/schemaTypes/
```

Expected output (1 file only):

```
index.ts
```

**Step 6: Verify staging has no local schema files**

```bash
ls apps/studio-staging/schemaTypes/
```

Expected output (1 file only):

```
index.ts
```

**Step 7: Verify `git diff --stat` shows clean state, then check for any drift**

```bash
git diff --name-only apps/studio/staging 2>/dev/null || echo "old staging path gone — good"
```

Expected: `old staging path gone — good`
