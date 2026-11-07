# KCVV Elewijt — Claude Code

## Project

Turborepo monorepo (pnpm). TypeScript strict, Effect, Tailwind v4.

| App/Package         | Path                       | Host               | Test layers ([notes](../docs/agents/testing-ops.md#test-layers-per-workspace)) |
| ------------------- | -------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| Next.js web         | `apps/web/`                | Vercel             | Static, Build, Vitest, Storybook VR (owns accessibility, gates), E2E           |
| Sanity Studio       | `apps/studio/`             | sanity.io          | Static, Build                                                                  |
| Sanity Studio (stg) | `apps/studio-staging/`     | sanity.io          | Static, Build                                                                  |
| Sanity schemas      | `packages/sanity-schemas/` | (library)          | Static                                                                         |
| Sanity Studio UI    | `packages/sanity-studio/`  | (library)          | Static, Vitest                                                                 |
| API contract        | `packages/api-contract/`   | (library)          | Static, Vitest, Build                                                          |
| BFF (CF Workers)    | `apps/api/`                | Cloudflare Workers | Static, Vitest, Contract (real workerd)                                        |
| Sanity ops scripts  | `scripts/sanity-ops/`      | (run by hand)      | Static, Vitest                                                                 |

App-specific rules → `apps/web/CLAUDE.md` | api-contract conventions → `packages/api-contract/CLAUDE.md`

### Sanity Studio — Dual Environment

`apps/studio/` (production) and `apps/studio-staging/` (staging) are two independent Sanity Studio configurations. Schemas are NOT copies — both studios consume `@kcvv/sanity-schemas` from `packages/sanity-schemas/`.

- **All schemas live in `packages/sanity-schemas/src/`** — the shared `@kcvv/sanity-schemas` package. Both studios import from this package and are identical in terms of schema types.
- **When touching any schema file:** edit `packages/sanity-schemas/src/<file>.ts` — changes there automatically apply to both studios. No per-studio counterpart check is needed.
- **Multi-file comparison signals:** when a review comment contains "out of sync", "sync", "match", or "parity" between two environments, read both sides before responding — confirming one side is correct does not falsify the claim.

## Git Workflow

1. **Worktree per issue:** `/ralph-once <issue-number>` or `/ralph-afk`; this repo's setup is in `docs/agents/ralph.md`.
2. **Commit messages** are checked by commitlint (`commitlint.config.js` lists the allowed types and scopes) in the `commit-msg` hook.
3. **Quality before commit:** `pnpm --filter @kcvv/web lint:fix` (web only — no other workspace has `lint:fix`) then `pnpm turbo run lint type-check test build --filter=@kcvv/web`. Changed another workspace? Filter on it instead; a shared package gets a leading `...` so its dependents are checked too: `--filter=...@kcvv/api-contract`, and `--filter=...@kcvv/sanity-schemas` for either Sanity package (that one also reaches studio typegen and the web build). **The gate is exactly four task names — lint, type-check, test, build.** What Turbo pulls in through `dependsOn` (upstream builds, studio typegen) is part of those four, not extra steps. A fifth task name is a decision, not a drift: add it to this command by ticket, never as a composite script (the old `check-all` was deleted in #3157 for running outside the task graph). The gate has **no clock budget** — the same suite measured 130 s, 295 s and 337 s on one machine, so a timer would fire because a browser is open.
4. **Branch guards:** two layers refuse a commit that would land on `main`/`master`, both worktree-aware and both allowing a detached HEAD. `.husky/branch-guard.sh` is the backstop — called from `.husky/pre-commit` (first, before `lint-staged`) and from `.husky/pre-merge-commit` (merges, which `pre-commit` does not fire for). It reads the branch inside git, so no command-string trick gets past it. `.claude/hooks/check-branch.sh` is the Claude Code `PreToolUse` layer that fails earlier with a friendlier message; it parses the command, so `cd` may appear anywhere in it and an explicit `git -C <dir>` is honoured.
5. **Not covered:** `git cherry-pick` and `git revert` run no commit hooks at all — a git design choice no hook can close.
6. **`ALLOW_MAIN_COMMIT=1` is a human escape hatch, not an agent one.** If a guard blocks you, the answer is a worktree (`/ralph-once`), never this variable — do not reach for it to get past a block, and do not suggest it. It exists so a human can make one deliberate commit on `main` without `--no-verify`, which would also skip commitlint and lint-staged.
7. **`main` is branch-protected (#3133).** Three required checks, all by the job's `name:` (not its id) and pinned to the GitHub Actions app: `Quality Checks + Build` (`quality-checks`), `VR — Gate` (`visual-regression-gate`, #3139) and `E2E` (`e2e`, #3151/#3220). **Never require the VR shards `Visual Regression (1/3)`…`(3/3)` by name** — when the path filter skips them, a skipped matrix job reports once as the literal `Visual Regression (${{ matrix.shard }}/3)`, so a PR that changes no story would wait forever. The gate job always reports, and it also `needs` `storybook-build`, so a broken story import blocks the merge. It is **loose**: _require branches to be up to date_ is off on wave cost, and a merge queue needs an organization-owned repository. No required reviews; admins are not enforced. **Linear history is required** — merge commits are refused on `main`; merge by squash or rebase. The _out-of-date_ banner on a pull request does not block the merge while strict is off. A docs-only pull request still merges because `ci.yml` filters docs at **job** level, and a job skipped by `if:` counts as passing — `e2e.yml` filters the same way, through its own `changes` job, never on the `on:` triggers. `e2e.yml` also dropped its `push: branches: [main]` trigger (#3151): it now runs on pull requests only, so a required `E2E` check depends entirely on that job-level filter reporting, not on a `main` run ever existing. **Never move either filter back to `on:` `paths-ignore`/`paths`** — a workflow that never triggers leaves the required check pending forever. Each later layer is _add one more required check_, never _set up protection again_. Deploy jobs never gate.

## Development Guidelines

### Adding a New Workspace Package

- **Scaffold from a peer, not from scratch:** Before writing any `package.json` or `tsconfig.json`, open the nearest sibling package's copies and reconcile every field. Use `packages/api-contract/` as the reference for library packages in this monorepo.
- **Audit `turbo.json` after every new package:** For every script in the new package, add or verify a task entry. Source-only packages (no build output) must have `"outputs": []` to prevent Turbo from expecting `dist/**`.

### Scaffold Individual Builders / Hooks From a Peer

Before writing a new JSON-LD builder, `use*Analytics` hook, repository, or any single file landing in a folder with ≥ 2 existing peers, grep the peers first and mirror: return type (e.g. `WithContext<T>` vs a loose document), import ordering, how optional fields are omitted (spread-conditional vs direct undefined), and param-shape conventions. Peer-drift was the most frequent review-flag class in #1333 (5 of 22 items) — one grep of `buildXxxJsonLd` or `use*Analytics` would have caught all five.

### A `readOnly` Field Needs a Named Writer

Declaring a Sanity field `readOnly: true` with a description like "gesynchroniseerd vanuit PSD" is a claim that something writes it. Verify the claim **before** declaring the field, not after:

- **A sync-owned field needs a named write site** in `apps/api/src/sync/psd-sanity-sync.ts` (or the equivalent sync module) — grep for the field name before adding it to a schema's read-only group, and confirm the upstream source (e.g. `PsdTeam`, `PsdMember`) actually carries the value.
- **No write site exists → delete the field, don't declare it "for later."** `team.season` was invented this way during the redesign: `readOnly: true`, "gesynchroniseerd vanuit PSD", and nothing ever wrote it — it went dark on every document and survived a full redesign unnoticed (#2535/#2567).

This is the **declaration-time** half of the Writer Rule. The **render-time** half (never fill a slot from a neighbour or a generic literal) lives in `apps/web/CLAUDE.md`; the concrete before/after lives in `docs/domain-reference.md`.

### `llms.txt` Is Hand-Maintained

Re-verify `apps/web/public/llms.txt` whenever routes are renamed/removed or club facts change — it hand-lists navigation paths and club facts that silently drift (it shipped `/club/organigram` long after the route was removed). Cross-check its paths against the live route tree and its facts against `apps/web/PRODUCT.md` → **Brand Commitments**, which is the authority. Note the club has **no** founding year on any surface but `/club/geschiedenis`: 1909 is inherited via mergers and is never asserted bare — `jsonld.ts` carries no `foundingDate` and the footer carries no year, so neither is a cross-check source (#2435).

### A Test May Not Use More Than Half Its Own Timeout

In every Vitest workspace, a test body spends at most half its own timeout (2 500 ms under the default 5 000 ms). Fix an over-budget test at the cause — never raise the timeout. A breach opens an issue, never a red check. The fake-timer recipe and the on-demand census over CI logs live in `apps/web/CLAUDE.md` → "A test may not use more than half its own timeout" (#3143).

### Shell Scripts Are Linted

Run `pnpm lint:sh` after touching a `*.sh` or `.husky/` file; CI runs it with no exceptions. A hook with no shebang gets `# shellcheck shell=sh`.

### Documentation Standards

- **Always add language identifiers to fenced code blocks** in plan/doc/markdown files (e.g. ` ```typescript `, ` ```json `, ` ```bash `, ` ```text `). Bare ` ``` ` blocks fail MD040 and are consistently flagged in code review.

### TypeScript Compiler — Dual-Install (tsgo + tsc)

`@typescript/native-preview` (`tsgo`) is the primary type-checker and runs every workspace's `type-check` script (and `packages/api-contract`'s `build`). Classic `typescript` (`tsc`) stays installed in every workspace because `typescript-eslint`, `knip`, `@sanity/cli` typegen, and Next.js's `next build` all resolve the `typescript` package name and consume its (unstable) compiler API. **Do not remove `typescript` from any workspace.** Revisit when `@typescript/native-preview` leaves `-dev`.

## Issue Tracking

Current work: `gh issue list --label in-progress --limit 100`

## Agent skills

### Issue tracker

The `gh` commands for issues, sub-issues and blocking: `docs/agents/issue-tracker.md`.

### Triage labels

Labels and what each means: `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — glossary at `GLOSSARY.md` (code names, rules and history per term in `docs/domain-reference.md`) + ADRs under docs/adr (created with the first ADR). See `docs/agents/domain.md`.
