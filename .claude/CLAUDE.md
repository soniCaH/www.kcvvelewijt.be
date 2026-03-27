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

- **All schemas live in `packages/sanity-schemas/src/`** — the shared `@kcvv/sanity-schemas` package. Both studios import from this package and are identical in terms of schema types. There are no production-only schemas; the previous `articleImage.ts`, `banner.ts`, and `homePage.ts` distinction no longer applies.
- **When touching any schema file:** edit `packages/sanity-schemas/src/<file>.ts` — changes there automatically apply to both studios. No per-studio counterpart check is needed.
- **Multi-file comparison signals:** when a review comment contains "out of sync", "sync", "match", or "parity" between two environments, read both sides before responding — confirming one side is correct does not falsify the claim.

## Git Workflow

1. **New worktree per issue:** `/ralph create <issue-number>` — never work on main
2. **Conventional commits:** `type(scope): description` — scopes: news, matches, teams, players, sponsors, calendar, ranking, api, ui, schema, config, deps
3. **Quality before commit:** `pnpm --filter @kcvv/web lint:fix` then `pnpm --filter @kcvv/web check-all`
4. **Never:** commit to main, push before checks pass, create PR without asking

## Issue Tracking

Current work lives in GitHub Issues. Check status: `gh issue list --label in-progress`
Skills: `.claude/skills/` — consult when relevant, never load all upfront.
