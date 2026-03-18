# KCVV Elewijt - Claude Code Instructions

## Project

- **Stack:** Turborepo monorepo + pnpm workspaces; Next.js 16, TypeScript strict, Effect, Tailwind CSS v4, Storybook 10, Vitest
- **Hosting:** Vercel (web) + Cloudflare Workers (BFF/API) | **CMS:** Sanity + Footbalisto API (deprecated - migrating out)

## Platform Architecture

| App/Package   | Path                     | Host               | Purpose                         |
| ------------- | ------------------------ | ------------------ | ------------------------------- |
| Next.js web   | `apps/web/`              | Vercel             | Club website                    |
| Sanity Studio | `apps/studio/`           | sanity.io          | CMS admin UI                    |
| API contract  | `packages/api-contract/` | (library)          | Shared Effect schemas + HttpApi |
| BFF           | `apps/api/`              | Cloudflare Workers | ProSoccerData proxy + cache     |

## Efficiency Rules (MANDATORY)

- Do NOT read DESIGN_SYSTEM.md, SCHEMA_GUIDE.md, STORYBOOK.md, or MIGRATION_PLAN.md unless explicitly asked. Use existing source code as reference instead.
- Do NOT spawn Explore/Plan agents for tasks involving ≤3 files. Read the files directly.
- Do NOT re-analyze project status. Check `gh issue list`.
- Do NOT explain what you're about to do — just do it.
- For simple feature/fix tasks: read relevant code → implement → test. No planning phase needed.
- When you learn something new about the Drupal/Footbalisto API (gotcha, edge case, failed approach), append it to the relevant skill file under "## Learnings".

## Current State

> Track progress in GitHub issues — use `gh issue list` for current status.
> Key issues: #721 (monorepo), #722 (api-contract), #723 (BFF), #724 (Sanity CMS), #755 (organigram).

## Git Workflow

1. **Branch first:** `git checkout -b <type>/<description>` — types: `feat/`, `fix/`, `migrate/`, `refactor/`, `docs/`, `test/`
2. **Conventional commits:** `type(scope): description` — scopes: news, matches, teams, players, sponsors, calendar, ranking, api, ui, schema, migration, config, deps
3. **Quality before commit:** run `pnpm --filter @kcvv/web lint:fix` (minimum) or `pnpm --filter @kcvv/web check-all` (preferred). Husky pre-commit runs lint-staged, type-check — run checks first to avoid failed commits.
4. **Push:** `git push -u origin <branch-name>`
5. **Never:** commit to `main`, create PR without asking, push before checks pass
6. **Worktree limitation:** The `check-branch.sh` hook reads `git branch` from `$CLAUDE_PROJECT_DIR` (always the main repo), not the worktree path — committing inside a worktree always looks like `main` to the hook. Use direct feature branch checkout instead of worktrees for this repo.

## Development Standards

- Effect Schema for all data validation (no `S.Unknown`)
- Test coverage minimum 80%
- Tailwind CSS only, primary green #4acf52
- ISR with appropriate `revalidate`
- `next/image` with proper `sizes`, `generateMetadata` for SEO
- Doc files (DESIGN_SYSTEM.md, SCHEMA_GUIDE.md, STORYBOOK.md) — do NOT consult unless explicitly asked.
- App-specific rules (Design System, Storybook, routes, test coverage) → see `apps/web/CLAUDE.md`
- api-contract conventions → see `packages/api-contract/CLAUDE.md`

## api-contract Gotchas

- **moduleResolution is `bundler`** — never add `.js` extensions to imports inside `packages/api-contract/src/`. NodeNext-style extensions break Turbopack.
- **Build verification before push** — after any change to `packages/api-contract`, run `pnpm turbo build --filter=@kcvv/web` locally. Turbopack resolves package exports differently from tsc project references; type-check passing ≠ build passing.
- **Barrel duplicate export pitfall** — if schema file A re-exports a type that also comes from schema file B, and the barrel does `export * from A` + `export * from B`, TypeScript silently drops the duplicate. Never re-export a type in a schema file unless it exists only there.
- **YAGNI for HttpApi** — don't add endpoints or response wrapper types to api-contract until `apps/api` actually needs to return them. `MatchesResponse`/`RankingResponse` are present but unused; remove if they remain unused after Phase 2.
- **No Players/Teams HttpApiGroup** — player and team data comes from Sanity (SanityService), not the BFF. Only match, ranking, and stats endpoints belong in PsdApi.

## Skills

- `.claude/skills/drupal-api-analyzer/` — Drupal JSON:API reference & learnings
- `.claude/skills/gatsby-nextjs-migration/` — Migration reference & learnings
