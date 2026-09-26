# KCVV Elewijt — Claude Code

## Project

Turborepo monorepo (pnpm). TypeScript strict, Effect, Tailwind v4.

| App/Package         | Path                       | Host               | Test layers                                                                               |
| ------------------- | -------------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| Next.js web         | `apps/web/`                | Vercel             | Static, Build, Vitest, Storybook VR[^vr] (owns accessibility, not yet gating[^a11y]), E2E |
| Sanity Studio       | `apps/studio/`             | sanity.io          | Static (lint), Build[^studio]                                                             |
| Sanity Studio (stg) | `apps/studio-staging/`     | sanity.io          | Static (lint)[^studio-staging]                                                            |
| Sanity schemas      | `packages/sanity-schemas/` | (library)          | Static[^sanity-schemas]                                                                   |
| Sanity Studio UI    | `packages/sanity-studio/`  | (library)          | Static, Vitest                                                                            |
| API contract        | `packages/api-contract/`   | (library)          | Static, Build[^api-contract]                                                              |
| BFF (CF Workers)    | `apps/api/`                | Cloudflare Workers | Static, Vitest, Contract (real workerd)[^api]                                             |
| Sanity ops scripts  | `scripts/sanity-ops/`      | (run by hand)      | Static, Vitest                                                                            |

[^vr]: Storybook VR runs pixel diffs at 3 viewports via `test-storybook`, scoped to `vr`-tagged stories only (`--includeTags vr --excludeTags vr-skip`, `apps/web/package.json`'s `vr:run`) — 183 of 208 story files carry the `vr` tag; the 21 `Pages/*` stories carry none and are never visited (consistent with `apps/web/CLAUDE.md`'s "not VR-tested" note). Runtime geometry (`play`) still lives in `scroll-arrows.spec.ts`/`section-nav.spec.ts` pending [#3146](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3146) — do not describe that move as done.

[^a11y]: **Authoritative text — `apps/web/CLAUDE.md` points here rather than repeating these numbers, so the two copies cannot drift.** `@storybook/addon-a11y` (`.storybook/main.ts`) runs inside the same `vr`-tagged run described in the note above — not every story, only the 183 of 208 story files carrying the `vr` tag — measured at 264 violation blocks / 288 violations per run, identical across sampled green runs. **Decided by the owner on 2026-09-25: Storybook VR owns accessibility.** It does not gate yet — [#3188](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3188) clears the 288 existing violations and then fails the job on any new one.

[^studio]: Config only (`sanity.config.ts`, `structure.ts`, `sanity.cli.ts`) plus migrations. No `type-check` script exists on this package itself, but `turbo build --filter=@kcvv/studio` (`sanity build`) runs in CI, as does the "Sanity types in sync" gate (`sanity schema extract && sanity typegen generate`, diffed against the committed types). Two untested surfaces remain, neither closed by build/lint: 11 of 26 migrations still hold logic in place (435 lines, closes with [#3153](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3153)), and `apps/studio/scripts/` — 4 files, 817 lines (`migrate-drupal-node.ts`, `remap-qa-respondent-keys.ts`, `seed-e2e-fixtures.ts`, `seed-interview-qa-pairs.ts`) — which #3153 does **not** cover.

[^studio-staging]: `turbo lint --filter=@kcvv/studio-staging` (`eslint .`) runs in CI's "Lint + type check Studio" step alongside `@kcvv/studio` and `@kcvv/sanity-studio` ([#3118](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3118)) — no type-check, no build, no typegen gate. Its own migrations count is 20, against `apps/studio/`'s 26 — the drift [#3120](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3120) named, closing with [#3153](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3153). Unlike `apps/studio/`, it has no `scripts/` directory.

[^sanity-schemas]: 4 195 lines, 0 tests, and no `ci.yml` step names this package directly — its own `type-check` script never runs. But its `build` script (`tsgo --noEmit`, functionally identical to `type-check`) runs transitively via `turbo.json`'s `^build` whenever `@kcvv/web` or `@kcvv/sanity-studio` type-checks or builds (confirmed via `turbo … --dry=json`), and the "Sanity types in sync" gate's `sanity schema extract` parses every schema here too — so the package is statically checked, just never through a step of its own. `validation/`, `preview/` and `blocks/` (629 lines of pure logic) are Vitest's named gap ([#3100](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3100) decision D9) — decided, not shipped, no open ticket. Schema declarations stay untested by design.

[^api-contract]: No `lint` script exists ([#3119](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3119)). `type-check` (`tsgo --noEmit`) is never invoked; `build` (`tsgo --build`) is — transitively via `^build` when `@kcvv/web`/`@kcvv/api` type-check or build, and directly in the deploy and E2E workflows (`ci.yml` "Build api-contract" steps, `e2e.yml`).

[^api]: Cache/TTL/single-flight semantics run in real workerd (`vitest.workers.config.ts`, `@cloudflare/vitest-plugin`); pure logic stays on the node pool (`vitest.node.config.ts`). Schema round-trip and cache-semantics work already shipped ([#3144](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3144), [#3145](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3145)).

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
7. **`main` is branch-protected (#3133).** Two required checks, both by the job's `name:` (not its id) and pinned to the GitHub Actions app: `Quality Checks + Build` (`quality-checks`) and `VR — Gate` (`visual-regression-gate`, #3139). **Never require the VR shards `Visual Regression (1/3)`…`(3/3)` by name** — when the path filter skips them, a skipped matrix job reports once as the literal `Visual Regression (${{ matrix.shard }}/3)`, so a PR that changes no story would wait forever. The gate job always reports, and it also `needs` `storybook-build`, so a broken story import blocks the merge. It is **loose**: _require branches to be up to date_ is off on wave cost, and a merge queue needs an organization-owned repository. No required reviews; admins are not enforced. **Linear history is required** — merge commits are refused on `main`; merge by squash or rebase. The _out-of-date_ banner on a pull request does not block the merge while strict is off. A docs-only pull request still merges because `ci.yml` filters docs at **job** level, and a job skipped by `if:` counts as passing. **Never move that filter back to `on:` `paths-ignore`** — a workflow that never triggers leaves the required check pending forever. Each later layer is _add one more required check_ (next: E2E, #3151), never _set up protection again_. Deploy jobs never gate.

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

### A Test May Not Use More Than Half Its Own Timeout

In every Vitest workspace, a test body spends at most half its own timeout (2 500 ms under the default 5 000 ms). Fix an over-budget test at the cause — never raise the timeout. A breach opens an issue, never a red check. The fake-timer recipe and the on-demand census over CI logs live in `apps/web/CLAUDE.md` → "A test may not use more than half its own timeout" (#3143).

### Shell Scripts Are Linted

`pnpm lint:sh` runs `shellcheck` over every tracked `*.sh` file and the `.husky/` hooks, at every severity, in the CI `Quality Checks + Build` job. It was adopted at zero findings, so any finding is a regression. A hook with no shebang (`.husky/commit-msg`) names its shell with a `# shellcheck shell=sh` line.

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
