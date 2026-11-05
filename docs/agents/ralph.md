# Ralph — this repo's values

`/ralph-once` and `/ralph-afk` run from the shared core in `~/personal-skills/ralph-once/` and `~/personal-skills/ralph-afk/`. This file holds only what is true for www.kcvvelewijt.be. Its sections follow `~/personal-skills/ralph-afk/REPO-CONFIG.md`; the shared rules (branches, commits, labels, who merges) are in `~/Sites/KCVV/CLAUDE.md`.

## Config

```sh ralph-config
SHORT='kcvv'
RULE_SURFACE='(^|/)(eslint\.config\.|commitlint\.config\.)|(^|/)__tests__/[^/]*consistency[^/]*\.test\.ts$|^\.husky/|^\.claude/hooks/'
CODE_SURFACE='^(apps|packages)/[^/]+/src/'
MIGRATION_SURFACE=''
LOCKFILE_SURFACE='^pnpm-lock\.yaml$'
CHECK_CMD='corepack pnpm turbo run lint type-check test build --filter=...<every workspace the rule covers or the branch touches>'
SCHEMA_REDO=''
ADR_DIR='docs/adr'
EXCLUDE_TITLE_PREFIX=''
```

`MIGRATION_SURFACE` is empty on purpose: this repo has no database migrations (§ Migrations). `EXCLUDE_TITLE_PREFIX` is empty because a spec issue never carries `ready-for-agent` (`docs/agents/triage-labels.md`).

## Read first

1. `.claude/CLAUDE.md` (the repo's; `~/Sites/KCVV/CLAUDE.md` loads by itself), then `apps/web/CLAUDE.md` for web work and the `CLAUDE.md` of any other workspace the issue touches.
2. The PRD or spec the issue names (read it from the main checkout path).
3. `GLOSSARY.md` — use its exact terms, never a synonym.
4. `.claude/commands/tdd.md` — the KCVV TDD loop. Then follow the `mattpocock-skills:tdd` skill it sends you to.
5. Any ADR (`docs/adr/`) or design doc the issue names.
6. Reads Sanity, calls the BFF, runs an Effect in a page, or changes `packages/api-contract` or `apps/api`: `.claude/skills/kcvv-stack/SKILL.md` (`fetchGroq`, `runPromise`, `degradeSection`, the wrangler commands).
7. Designs an interface or chases a bug: `docs/agents/code-patterns.md`.

Before code, re-validate each acceptance criterion against the repo today. A criterion already met, or contradicted by the code, goes in the PR body, never silently reinterpreted.

## Bootstrap

From the worktree root (`cwd` = the worktree):

```bash
source ~/.nvm/nvm.sh && nvm use --silent
corepack pnpm install --frozen-lockfile                        # corepack pnpm, never Homebrew's 8.x (it rewrites the lockfile to v6)
git status --short pnpm-lock.yaml                              # lockfile guard: must print nothing
/bin/cp -f "$MAIN/apps/web/.env.local" apps/web/.env.local     # next build needs the Sanity env; it is git-ignored
```

- A dirty lockfile after install: `git checkout -- pnpm-lock.yaml && corepack pnpm install --frozen-lockfile`.
- Start every later shell command with `source ~/.nvm/nvm.sh && nvm use --silent &&`. A fresh shell defaults to Node 16, which breaks commitlint and Playwright with misleading errors.
- Type-check shows TS6305 ("has not been built from source"): a Turbo cache replay from another worktree. Re-run once with `--force`.

## Checks

The gate is `.claude/CLAUDE.md` → Git Workflow 3. `CHECK_CMD` (§ Config) is its workspace-generic form, which `wave-check.sh` quotes as the re-check for a rule-vs-code pair. On top of the gate:

- Touched a `*.sh` or a `.husky/` hook: `pnpm lint:sh`.
- Touched `.husky/` or `.claude/hooks/`: `pnpm --filter @kcvv/web test` — `apps/web/test/hooks/` is those scripts' only test home.
- Touched `commitlint.config.js`: no automated test covers it. Make a deliberately malformed commit in a scratch worktree and confirm it is refused.

## Dev server

- Port **3000** is Kevin's. Never kill or reuse a server on it.
- To look at a page: `pnpm -C <worktree>/apps/web build && pnpm -C <worktree>/apps/web exec next start -p 3100`, then stop only that PID (`kill <pid>`), never `pkill`.
- Pages that call the BFF need it on **:8787** (`KCVV_API_URL` in `.env.local`). Without it they 500 — not a bug in your change.
- Playwright e2e derives its own dev port per worktree (`apps/web/scripts/e2e-dev-port.mjs`) with `reuseExistingServer: false`; never hard-code one.

## Long runs

- A full visual-regression capture or check (`vr:check`, `vr:update*`) can pass 10 minutes. The core's long-run handoff applies.

## Pre-flight

In the main checkout, before a wave or a once-run:

```bash
git -C "$MAIN" fetch --prune origin             # fetch only: other sessions share the main checkout; worktrees start from origin/main
corepack pnpm --filter @kcvv/web run vr:build-image    # once per wave, never inside a lane
```

`vr:build-image` may be skipped only when no issue in the wave touches a VR-tagged story or calls `vr:*`. A missing or stale image makes the first such call fail fast, naming this command.

## Migrations

None. The site has no database. Sanity schema changes need no data step; a content migration under `packages/sanity-studio/src/migrations/` is run against a dataset by Kevin, never by an agent, so an agent that writes one says so in the PR body and files the run as a `ready-for-human` issue before its branch closes.

## Collision classes

| Class                                                                                                | Why it collides                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **busy:** package (`pnpm-lock.yaml`)                                                                 | The lockfile is prettier-formatted; every agent edits the same three blocks. Two = a guaranteed conflict.                                                                                             |
| **busy:** rule (lint config, commitlint, a whole-tree consistency test, `.husky/`, `.claude/hooks/`) | A branch that adds a rule and a branch that adds code can break each other with no shared file. #2882 and #2880 took `main` down twenty seconds apart.                                                |
| Visual-regression baselines                                                                          | A scoped `-u` run rewrites baseline PNGs; two lanes overwrite each other. Judge by "will this change rendered markup?", not by whether the issue says VR (#2562 never did and captured 48 baselines). |
| `packages/api-contract/src/`                                                                         | Every downstream app type-checks against it; two contract changes break each other's build.                                                                                                           |
| `packages/sanity-schemas/src/`                                                                       | Shared by both studios and the typegen gate.                                                                                                                                                          |
| Design tokens, `DESIGN.md`, global CSS                                                               | Site-wide; two edits conflict and both invalidate the whole VR suite.                                                                                                                                 |
| The same route or component file                                                                     | Check the files each issue names; two issues editing one file conflict line for line.                                                                                                                 |

## Shared resources

Separate worktrees isolate the filesystem and nothing else. A wave stays at **4** lanes at every runner's default worker count; no concurrency cap is adopted (#3090, #3124, #3141).

| Resource                        | Guard                                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fixed TCP ports in tests        | An ephemeral port (`listen(0)`), and a `no-restricted-syntax` ban on `.listen(` in test files (#3109, #3127).                                                         |
| The VR Docker image             | Built once in § Pre-flight. `apps/web/scripts/vr-docker.mjs` never builds it; it fails fast when the image is absent or stale (#3141).                                |
| The VR container                | An exclusive lock in `vr-docker.mjs`, taken before the Storybook build. A second caller is refused with the lock path. Retry when it frees up; never route around it. |
| The Docker Compose project name | Covered by the VR lock.                                                                                                                                               |
| The e2e dev server port         | Derived per worktree path, `reuseExistingServer: false` (#3141).                                                                                                      |

## Per-slice extras

- **VR baselines:** a visual change to a VR-tagged story captures its baselines in the same PR, one prefix per run, through `pnpm --filter @kcvv/web run vr:update:story -- <story-id-prefix>` only (it runs in the pinned amd64 container). Before claiming no baseline moved, grep `*.stories.tsx` for imports of every `page.tsx` and `loading.tsx` you changed.
- **Analytics:** a feature that adds interactive UI needs its events, GTM and GA4 entries (`apps/web/CLAUDE.md` → Analytics Checklist for New Features).
- **Dependency:** never let pnpm rewrite the lockfile. Resolve the version once, `git checkout origin/main -- pnpm-lock.yaml`, hand-insert the three blocks (importers, packages, snapshots) in prettier style, and confirm `corepack pnpm install --frozen-lockfile` changes nothing.
- **The rest** (schemas, `llms.txt`, CLAUDE.md updates, scaffolding from peers): `.claude/CLAUDE.md` → Development Guidelines.

## Implementer agent

`subagent_type: "kcvv-implementer"` (`.claude/agents/kcvv-implementer.md`). Stack: pnpm + Turborepo monorepo — Next.js on Vercel, Sanity Studio, a Cloudflare Workers BFF, TypeScript strict, Effect, Tailwind v4.

## PR

Title: `<type>(<scope>): <description> (#<N>)`, a conventional commit with a scope from `commitlint.config.js` — the squash merge makes it the commit on `main`. Body: the core's sections only.

## Hard rules

- No `eslint-disable` comments; fix the site. (#3717 moves checkable rules into lint.)
- The rest: `.claude/CLAUDE.md` → Git Workflow 6 (`ALLOW_MAIN_COMMIT`) and § Migrations above (Sanity writes).

## Loop

`45m` — `/loop 45m /ralph-afk`.
