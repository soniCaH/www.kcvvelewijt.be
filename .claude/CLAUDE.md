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
5. **Branch guards:** two layers refuse a commit that would land on `main`/`master`, both worktree-aware and both allowing a detached HEAD. `.husky/branch-guard.sh` is the backstop — called from `.husky/pre-commit` (first, before `lint-staged`) and from `.husky/pre-merge-commit` (merges, which `pre-commit` does not fire for). It reads the branch inside git, so no command-string trick gets past it. `.claude/hooks/check-branch.sh` is the Claude Code `PreToolUse` layer that fails earlier with a friendlier message; it parses the command, so `cd` may appear anywhere in it and an explicit `git -C <dir>` is honoured. **Not covered:** `git cherry-pick` and `git revert` run no commit hooks at all — a git design choice no hook can close.
6. **`ALLOW_MAIN_COMMIT=1` is a human escape hatch, not an agent one.** If a guard blocks you, the answer is a worktree (`/ralph`), never this variable — do not reach for it to get past a block, and do not suggest it. It exists so a human can make one deliberate commit on `main` without `--no-verify`, which would also skip commitlint and lint-staged.
7. **`main` is branch-protected (#3133).** One required check: `Quality Checks + Build` — the job's `name:`, not its id `quality-checks`; pinned to the GitHub Actions app. It is **loose**: *require branches to be up to date* is off on wave cost, and a merge queue needs an organization-owned repository. No required reviews; admins are not enforced. A docs-only pull request still merges because `ci.yml` filters docs at **job** level, and a job skipped by `if:` counts as passing. **Never move that filter back to `on:` `paths-ignore`** — a workflow that never triggers leaves the required check pending forever. Each later layer is *add one more required check* (order: visual regression → E2E), never *set up protection again*. Deploy jobs never gate.

### The review gate is the last gate

`/code-review` + `/simplify` on the branch diff is the **last gate** — the final automated read a branch gets before a human sees it. A finding skipped there is a finding that ships. Where it runs differs by tool: inline before the push under `/ralph`, at the orchestrator against a draft PR under `/ralph-afk`.

CodeRabbitAI is not a second gate. The account gets one free review an hour and is routinely rate-limited, so it is a bonus when it lands and never something to bank a skipped finding on. A wave opens four PRs at once; three of them get no CodeRabbit read at all.

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

### A `readOnly` Field Needs a Named Writer

Declaring a Sanity field `readOnly: true` with a description like "gesynchroniseerd vanuit PSD" is a claim that something writes it. Verify the claim **before** declaring the field, not after:

- **A sync-owned field needs a named write site** in `apps/api/src/sync/psd-sanity-sync.ts` (or the equivalent sync module) — grep for the field name before adding it to a schema's read-only group, and confirm the upstream source (e.g. `PsdTeam`, `PsdMember`) actually carries the value.
- **No write site exists → delete the field, don't declare it "for later."** `team.season` was invented this way during the redesign: `readOnly: true`, "gesynchroniseerd vanuit PSD", and nothing ever wrote it — it went dark on every document and survived a full redesign unnoticed (#2535/#2567).

This is the **declaration-time** half of the Writer Rule. The **render-time** half (never fill a slot from a neighbour or a generic literal) lives in `apps/web/CLAUDE.md`; the concrete before/after lives in `docs/ubiquitous-language.md`.

### CLAUDE.md Is a Required Deliverable

When a task changes the architecture described in CLAUDE.md (new packages, renamed paths, schema ownership), add a named "Update CLAUDE.md" step to the implementation plan before the final commit. Do not treat it as optional cleanup.

### Plan and Doc Audit Before Closing a Branch

Before the final commit on any branch, re-read every plan/doc file touched and verify that paths, script names, and code snippets match the current file tree. Stale plan files trigger the same review feedback as stale code.

**Also re-verify `apps/web/public/llms.txt`** whenever routes are renamed/removed or club facts change — it hand-lists navigation paths and club facts that silently drift (it shipped `/club/organigram` long after the route was removed). Cross-check its paths against the live route tree and its facts against `apps/web/PRODUCT.md` → **Brand Commitments**, which is the authority. Note the club has **no** founding year on any surface but `/club/geschiedenis`: 1909 is inherited via mergers and is never asserted bare — `jsonld.ts` carries no `foundingDate` and the footer carries no year, so neither is a cross-check source (#2435).

### Documentation Standards

- **Always add language identifiers to fenced code blocks** in plan/doc/markdown files (e.g. ` ```typescript `, ` ```json `, ` ```bash `, ` ```text `). Bare ` ``` ` blocks fail MD040 and are consistently flagged in code review.

### TypeScript Compiler — Dual-Install (tsgo + tsc)

`@typescript/native-preview` (`tsgo`) is the primary type-checker and runs every workspace's `type-check` script (and `packages/api-contract`'s `build`). Classic `typescript` (`tsc`) stays installed in every workspace because `typescript-eslint`, `knip`, `@sanity/cli` typegen, and Next.js's `next build` all resolve the `typescript` package name and consume its (unstable) compiler API. **Do not remove `typescript` from any workspace.** Revisit this split after TypeScript 7.0 GA (est. July 2026).

## Issue Tracking

Current work lives in GitHub Issues. Check status: `gh issue list --label in-progress`
Skills: `.claude/skills/` — consult when relevant, never load all upfront.

## Agent skills

### Issue tracker

Issues and PRDs live in GitHub Issues (via the `gh` CLI); external PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Five triage roles → repo labels: `ready-for-agent` → existing `ready`, `wontfix` → `wontfix`, the rest as-named. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — glossary at `docs/ubiquitous-language.md` + `docs/adr/`. See `docs/agents/domain.md`.
