# KCVV Elewijt — Claude Code

## Project

Turborepo monorepo (pnpm). TypeScript strict, Effect, Tailwind v4.

| App/Package      | Path                     | Host               |
| ---------------- | ------------------------ | ------------------ |
| Next.js web      | `apps/web/`              | Vercel             |
| Sanity Studio    | `apps/studio/`           | sanity.io          |
| API contract     | `packages/api-contract/` | (library)          |
| BFF (CF Workers) | `apps/api/`              | Cloudflare Workers |

App-specific rules → `apps/web/CLAUDE.md` | api-contract conventions → `packages/api-contract/CLAUDE.md`

### Sanity Studio — Dual Environment

`apps/studio/` (production) and `apps/studio/staging/` (staging) are two independent Sanity Studio configurations with separate project IDs. Schema files are full copies — not a base/override relationship.

- **Production-only schemas** (absent from staging): `articleImage.ts`, `banner.ts`, `homePage.ts`. All other `schemaTypes/*.ts` files are shared and must stay in sync.
- **When touching any `apps/studio/schemaTypes/<file>.ts`:** check whether a counterpart exists in `apps/studio/staging/schemaTypes/` and apply the equivalent change. Verify parity with `git diff --no-index apps/studio/schemaTypes/<file> apps/studio/staging/schemaTypes/<file>` before declaring the task complete.
- **Multi-file comparison signals:** when a review comment contains "out of sync", "sync", "match", or "parity" between two environments, read both sides before responding — confirming one side is correct does not falsify the claim.

## Git Workflow

1. **New worktree per issue:** `/ralph create <issue-number>` — never work on main
2. **Conventional commits:** `type(scope): description` — scopes: news, matches, teams, players, sponsors, calendar, ranking, api, ui, schema, config, deps
3. **Quality before commit:** `pnpm --filter @kcvv/web lint:fix` then `pnpm --filter @kcvv/web check-all`
4. **Never:** commit to main, push before checks pass, create PR without asking

## Issue Tracking

Current work lives in GitHub Issues. Check status: `gh issue list --label in-progress`
Skills: `.claude/skills/` — consult when relevant, never load all upfront.
