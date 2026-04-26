# KCVV Elewijt — Claude Code

## Project

Turborepo monorepo (pnpm). TypeScript strict, Effect, Tailwind v4.

| App/Package         | Path                       | Host               |
| ------------------- | -------------------------- | ------------------ |
| Next.js web         | `apps/web/`                | Vercel             |
| Sanity Studio       | `apps/studio/`             | sanity.io          |
| Sanity Studio (stg) | `apps/studio-staging/`     | sanity.io          |
| Sanity schemas      | `packages/sanity-schemas/` | (library)          |
| Sanity Studio UI    | `packages/sanity-studio/`  | (library)          |
| API contract        | `packages/api-contract/`   | (library)          |
| BFF (CF Workers)    | `apps/api/`                | Cloudflare Workers |

App-specific rules → `apps/web/CLAUDE.md` | api-contract conventions → `packages/api-contract/CLAUDE.md`

### Sanity Studio — Dual Environment

`apps/studio/` (production) and `apps/studio-staging/` (staging) are two independent Sanity Studio configurations. Schemas are NOT copies — both studios consume `@kcvv/sanity-schemas` from `packages/sanity-schemas/`.

- **All schemas live in `packages/sanity-schemas/src/`** — the shared `@kcvv/sanity-schemas` package. Both studios import from this package and are identical in terms of schema types. There are no production-only schemas; the previous `articleImage.ts`, `banner.ts`, and `homePage.ts` distinction no longer applies.
- **When touching any schema file:** edit `packages/sanity-schemas/src/<file>.ts` — changes there automatically apply to both studios. No per-studio counterpart check is needed.
- **Multi-file comparison signals:** when a review comment contains "out of sync", "sync", "match", or "parity" between two environments, read both sides before responding — confirming one side is correct does not falsify the claim.

## Git Workflow

1. **New worktree per issue:** `/ralph create <issue-number>` — never work on main
2. **Conventional commits:** `type(scope): description` — scopes: news, matches, events, teams, players, sponsors, calendar, ranking, search, sync, analytics, studio, api, ui, schema, config, deps, deps-dev
3. **Quality before commit:** `pnpm --filter @kcvv/web lint:fix` then `pnpm --filter @kcvv/web check-all`
4. **Never:** commit to main, push before checks pass, create PR without asking

## Development Guidelines

### Adding a New Workspace Package

- **Scaffold from a peer, not from scratch:** Before writing any `package.json` or `tsconfig.json`, open the nearest sibling package's copies and reconcile every field. Use `packages/api-contract/` as the reference for library packages in this monorepo.
- **Audit `turbo.json` after every new package:** For every script in the new package, add or verify a task entry. Source-only packages (no build output) must have `"outputs": []` to prevent Turbo from expecting `dist/**`.

### Scaffold Individual Builders / Hooks From a Peer

Before writing a new JSON-LD builder, `use*Analytics` hook, repository, or any single file landing in a folder with ≥ 2 existing peers, grep the peers first and mirror: return type (e.g. `WithContext<T>` vs a loose document), import ordering, how optional fields are omitted (spread-conditional vs direct undefined), and param-shape conventions. Peer-drift was the most frequent review-flag class in #1333 (5 of 22 items) — one grep of `buildXxxJsonLd` or `use*Analytics` would have caught all five.

### Promoting a Nested Directory to a Workspace Member

After `git mv <nested-dir> <new-path>`:

1. Verify `.gitignore` was not silently lost — nested dirs inherit parent's ignore rules, siblings do not. Copy from the peer studio.
2. Check that auto-generated tooling dirs (`.sanity/runtime/`, `.turbo/`) are listed in the new `.gitignore` and already untracked (`git rm --cached -r <dir>` if needed).

### CLAUDE.md Is a Required Deliverable

When a task changes the architecture described in CLAUDE.md (new packages, renamed paths, schema ownership), add a named "Update CLAUDE.md" step to the implementation plan before the final commit. Do not treat it as optional cleanup.

### Plan and Doc Audit Before Closing a Branch

Before the final commit on any branch, re-read every plan/doc file touched and verify that paths, script names, and code snippets match the current file tree. Stale plan files trigger the same review feedback as stale code.

### Documentation Standards

- **Always add language identifiers to fenced code blocks** in plan/doc/markdown files (e.g. ` ```typescript `, ` ```json `, ` ```bash `, ` ```text `). Bare ` ``` ` blocks fail MD040 and are consistently flagged in code review.

### TypeScript Compiler — Dual-Install (tsgo + tsc)

`@typescript/native-preview` (`tsgo`) is the primary type-checker and runs every workspace's `type-check` script (and `packages/api-contract`'s `build`). Classic `typescript` (`tsc`) stays installed in every workspace because `typescript-eslint`, `knip`, `@sanity/cli` typegen, and Next.js's `next build` all resolve the `typescript` package name and consume its (unstable) compiler API. **Do not remove `typescript` from any workspace.** Revisit this split after TypeScript 7.0 GA (est. July 2026).

## Issue Tracking

Current work lives in GitHub Issues. Check status: `gh issue list --label in-progress`
Skills: `.claude/skills/` — consult when relevant, never load all upfront.
