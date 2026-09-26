# Agent-layer suite-command sweep (pass 1)

Resolves [#3113](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3113) — _Task: sweep the agent skills and hooks for suite commands that contradict the contract_ — a child of the [test-suite walk map (#3078)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078).

Measured **2026-09-23** against `origin/main` @ `4aedfc48`. Line numbers below are `origin/main` line numbers unless a row says otherwise.

**Nothing is fixed here.** The ticket's deliverable is the inventory plus one recommendation per bad row; fixes ride with the spec's own tickets, because a fix that lands before the spec may be undone by it.

## Headline

| Verdict                                                                                    |   Rows |
| ------------------------------------------------------------------------------------------ | -----: |
| **wrong** — the script, filter or flag does not exist, or does not do what the text claims |      7 |
| **bypassing** — reaches past a wrapper the repo provides                                   |     12 |
| **stale** — a duration, threshold or behaviour that measurement has falsified              |      1 |
| **fine**                                                                                   |     15 |
| **Total rows**                                                                             | **35** |

Two findings carry almost all the weight:

1. **Eleven of the twelve _bypassing_ rows are the same command** — `pnpm --filter @kcvv/web check-all` — repeated across **9 files**. `check-all` is not a Turbo task; it is `npm run lint && npm run type-check && npm run test && npm run build` inside `apps/web` (`apps/web/package.json`). Every agent-facing quality gate in this repo therefore runs **outside Turbo**, reads and writes **no cache**, and skips the task graph. One replacement closes all eleven rows.
2. **The whole `~/.claude-amexio/CLAUDE.md` file is for a different repo** and instructs every session in that profile to run five scripts that exist in **no** workspace here. It is a _user-level_ file, so it outranks the repo's own `.claude/CLAUDE.md` in the instruction hierarchy.

## 1. Ground truth — what the suite actually offers

Every verdict below is measured against these, not against habit.

**Root `package.json` scripts** (all Turbo-backed): `dev`, `build`, `test`, `lint`, `type-check`, `knip`, `knip:code`, `prepare`. `packageManager` is **`pnpm@10.34.5`**.

**`turbo.json` tasks:** `build`, `dev`, `test`, `lint`, `type-check`, plus per-package overrides (`@kcvv/studio#typegen`, `@kcvv/web#build`, `@kcvv/studio#deploy`, and `outputs: []` entries for the source-only packages). **There is no `check-all` task** (`grep -c check-all turbo.json` → `0`).

**`check-all` exists in exactly two workspaces:**

- `apps/web` → `npm run lint && npm run type-check && npm run test && npm run build`
- `packages/sanity-studio` → `pnpm type-check && pnpm lint && pnpm test`

The other five workspaces (`@kcvv/api`, `@kcvv/studio`, `@kcvv/studio-staging`, `@kcvv/sanity-schemas`, `@kcvv/api-contract`) have **no** `check-all`.

**No workspace defines** `validate`, `deps:lint`, `deps:lint-unused` or `circular:check`. `test:coverage` exists only inside `apps/web` and `apps/api` — never at the root. There is no `packages/main`, and no NX: this is Turborepo.

**Root `devDependencies`:** `@commitlint/cli`, `@commitlint/config-conventional`, `eslint`, `husky`, `knip`, `lint-staged`, `playwright`, `prettier`, `prettier-plugin-tailwindcss`, `turbo`. **`vitest` is not among them**, so a bare `pnpm vitest` at the repo root cannot resolve a binary.

**The VR wrapper** (`apps/web/scripts/vr-docker.mjs`) is the guarded surface for the four local Docker VR entrypoints — `vr:check`, `vr:update`, `vr:update:single`, `vr:update:story`. Its `decide()` refuses:

- `vr:check` **always** — "check mode has no scoped form, so this is always the full suite"
- any update **without a story-id pattern** — "this would regenerate every baseline"

`VR_FULL_RUN=1` is the only override. On success the wrapper runs `pnpm run vr:build-storybook`, then `docker compose -f docker-compose.vr.yml run --build --rm vr …`, which is where the `platform: linux/amd64` pin lives (#2370, ~3.6× emulation cost). CI does **not** go through the wrapper: `vr:ci` / `vr:ci:update` call `vr:run*` directly, without Docker.

**Node:** the default shell is **v20.20.0**. `apps/api`'s wrangler is **4.127.0**, whose `engines` field is `{ node: '>=22.0.0' }`.

**pnpm on `PATH`:** `/Users/kevinvanransbeeck/.nvm/versions/node/v20.20.0/bin/pnpm` → 10.34.5. A homebrew pnpm **does** still exist at `/opt/homebrew/bin/pnpm` → **8.7.5**, so the AFK brief's warning about it is substantively correct.

## 2. The inventory

`profile` column: **repo** = in git, both Claude profiles load the identical copy. **amexio** = `~/.claude-amexio/` only. **personal** = `~/.claude-personal/` only.

### 2.1 Wrong

| #   | Location                                                                           | Profile | Command as written                                                                                                                                          | Why it is wrong                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| W1  | `.claude/commands/triage-issue.md:121`                                             | repo    | `pnpm --filter @kcvv/[package] check-all`                                                                                                                   | A template that is valid for **2 of 7** workspaces. For `@kcvv/api`, `@kcvv/studio`, `@kcvv/studio-staging`, `@kcvv/sanity-schemas` and `@kcvv/api-contract` there is no `check-all` script, so the acceptance criterion cannot be satisfied as written.                                                                                                                                                                                                                                         |
| W2  | `.claude/skills/ralph-afk/AFK-BRIEF.md:91` **(working tree only — not in `HEAD`)** | repo    | "a full `vr:check` — 25–60 minutes"                                                                                                                         | Wrong twice. `vr:check` is **always refused** locally by `vr-docker.mjs`, so there is no such run to time; and a deliberate full local run (`VR_FULL_RUN=1`) is **~2.5 h**, not 25–60 min, because of the amd64 pin. Found by [#3088](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3088). **New in this sweep:** `git show HEAD:.claude/skills/ralph-afk/AFK-BRIEF.md` does not contain the line — it is an **uncommitted** local addition, so it can be corrected before it ever lands. |
| W3  | `.claude/skills/kcvv-stack/SKILL.md:59`                                            | repo    | `cd apps/api && pnpm wrangler deploy`                                                                                                                       | Fails on the default shell. Reproduced: `cd apps/api && pnpm wrangler --version` → `Wrangler requires at least Node.js v22.0.0. You are using v20.20.0.` Independently, it ignores the workspace's own `deploy` / `deploy:staging` scripts, and it lists **production before staging**, against the owner's standing staging-first rule.                                                                                                                                                         |
| W4  | `.claude/skills/kcvv-stack/SKILL.md:65`                                            | repo    | `pnpm wrangler tail --format pretty`                                                                                                                        | Same Node-22 failure. Also the only line in that block with no `cd apps/api`, so an agent copying it alone runs it at the repo root, where wrangler is not a dependency.                                                                                                                                                                                                                                                                                                                         |
| W5  | `.claude/skills/kcvv-stack/SKILL.md:68`                                            | repo    | `npx wrangler kv key get --binding=PSD_CACHE --remote …`                                                                                                    | Same Node-22 failure, **and** `npx` resolves wrangler from the registry rather than the version pinned in `apps/api`.                                                                                                                                                                                                                                                                                                                                                                            |
| W6  | `~/.claude-amexio/CLAUDE.md` (whole file)                                          | amexio  | `pnpm validate`, `pnpm test:coverage`, `pnpm deps:lint`, `pnpm deps:lint-unused`, `pnpm circular:check`, `pnpm vitest packages/main/src/<affected-domain>/` | **None of these exist in this repo.** Four of the scripts exist in no workspace at all; `test:coverage` exists only inside `apps/web`/`apps/api`, never at the root; there is no `packages/main`; and the file's "NX cache" section describes a build system this repo does not use. It is a **user-level** file, so it outranks `.claude/CLAUDE.md` in the instruction hierarchy while being wrong about every command it names.                                                                |
| W7  | `~/.claude-amexio/agents/stijn.md:55`                                              | amexio  | `pnpm lint`, `pnpm validate`, `pnpm vitest <affected>`                                                                                                      | `pnpm lint` is fine (`turbo lint`). `pnpm validate` does not exist. `pnpm vitest` cannot resolve — `vitest` is not a root devDependency.                                                                                                                                                                                                                                                                                                                                                         |

### 2.2 Bypassing

| #   | Location                                      | Profile | Command                                                                     | What it costs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------- | ------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | `.claude/CLAUDE.md:31`                        | repo    | `pnpm --filter @kcvv/web lint:fix` then `pnpm --filter @kcvv/web check-all` | The `check-all` class — see §3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| B2  | `.claude/commands/ralph.md:92`                | repo    | `pnpm --filter @kcvv/web check-all`                                         | The `check-all` class.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| B3  | `.claude/commands/spec.md:80`                 | repo    | `pnpm --filter @kcvv/web check-all` passes                                  | The `check-all` class; also hard-codes `@kcvv/web` into an AC template used for non-web issues.                                                                                                                                                                                                                                                                                                                                                                                                 |
| B4  | `.claude/commands/write-a-prd.md:43`          | repo    | `pnpm --filter @kcvv/web check-all` passes                                  | As B3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| B5  | `.claude/commands/prd-to-issues.md:46`        | repo    | `pnpm --filter @kcvv/web check-all` passes                                  | As B3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| B6  | `.claude/commands/tdd.md:56`                  | repo    | `pnpm --filter @kcvv/web check-all`                                         | The `check-all` class.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| B7  | `.claude/commands/tdd.md:100`                 | repo    | `pnpm --filter @kcvv/web check-all` passes                                  | The `check-all` class.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| B8  | `.claude/skills/ralph-afk/AFK-BRIEF.md:86-87` | repo    | `corepack pnpm --filter @kcvv/web lint:fix` / `… check-all`                 | The `check-all` class, run by every wave agent.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| B9  | `.claude/skills/ralph-afk/AFK-BRIEF.md:122`   | repo    | `pnpm --filter @kcvv/web check-all passes`                                  | The `check-all` class, as a PR acceptance line.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| B10 | `.claude/skills/ralph-afk/SKILL.md:214`       | repo    | `pnpm --filter @kcvv/web check-all`                                         | The `check-all` class.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| B11 | `.claude/skills/ralph-afk/AFK-BRIEF.md:78`    | repo    | ``Capture the new baselines … scoped: `-u <story-id-prefix>` ``             | **Skips the VR guard entirely.** The text names the raw `test-storybook` flag, not the wrapper. An agent that follows it literally runs the capture on the host: no `vr-docker.mjs` refusal, no Storybook rebuild, and **no `linux/amd64` container** — so baselines are captured on arm64 and are not byte-identical to CI (#2370). Found by [#3088](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3088).                                                                               |
| B12 | `.claude/commands/ralph.md:59`                | repo    | `pnpm install` (in a fresh worktree)                                        | PATH-dependent lockfile corruption. `AFK-BRIEF.md:47-49` warns that the homebrew pnpm is 8.x and "silently downgrades `pnpm-lock.yaml` from lockfileVersion 9.0 to 6.0 (a ~22k-line diff)"; that binary still exists here (`/opt/homebrew/bin/pnpm` → 8.7.5). `/ralph` (the human loop) teaches the unguarded form while `/ralph-afk` teaches `corepack pnpm install --frozen-lockfile`. Also drops `--frozen-lockfile`, so a worktree install may rewrite the lockfile even on the right pnpm. |

### 2.3 Stale

| #   | Location                                   | Profile | Claim                                         | Measurement                                                                                                                                                                            |
| --- | ------------------------------------------ | ------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | `.claude/skills/ralph-afk/AFK-BRIEF.md:47` | repo    | "Install with corepack pnpm (pinned 10.34.3)" | `package.json` → `"packageManager": "pnpm@10.34.5"`. The _warning_ the comment carries is correct; only the version is stale. Quoting a version in prose guarantees this drifts again. |

### 2.4 Fine

| Location                                                                                                                                                    | Profile  | Note                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/commands/ralph.md:94`                                                                                                                              | repo     | `pnpm turbo build --filter=@kcvv/web` — a real Turbo task.                                                                                                                                                                      |
| `.claude/commands/triage-issue.md:148`                                                                                                                      | repo     | `pnpm turbo build` — a real Turbo task.                                                                                                                                                                                         |
| `.claude/commands/tdd.md:41`                                                                                                                                | repo     | `pnpm --filter @kcvv/web exec vitest run [test-file]` — correct tool for a single-file red/green loop; Turbo has nothing to cache for one file.                                                                                 |
| `.claude/commands/tdd.md:43`                                                                                                                                | repo     | `pnpm --filter @kcvv/api exec vitest run [test-file]` — as above; `@kcvv/api` is a real package name.                                                                                                                           |
| `.claude/skills/ralph-afk/AFK-BRIEF.md:49`                                                                                                                  | repo     | `corepack pnpm install --frozen-lockfile` — the safe form B12 should copy.                                                                                                                                                      |
| `.claude/skills/ralph-afk/AFK-BRIEF.md:57`                                                                                                                  | repo     | `corepack pnpm turbo build --filter=@kcvv/api-contract --force` — a real Turbo task. See §3: the recommended `check-all` replacement makes this step redundant.                                                                 |
| `.claude/skills/ralph-afk/SKILL.md:215`                                                                                                                     | repo     | `pnpm lint && pnpm type-check && pnpm test && pnpm build` from the repo root — **the one fully Turbo-native quality gate in the agent layer**, and the model §3 generalises. Only nit: unfiltered, so it walks every workspace. |
| `.claude/skills/ralph-afk/SKILL.md:216`                                                                                                                     | repo     | `pnpm --filter @kcvv/web test` for `.husky/` and `.claude/hooks/` changes — correct, and matched by `turbo.json`'s `test.inputs` hashing `$TURBO_ROOT$/.husky/**` (#3096).                                                      |
| `.claude/skills/kcvv-stack/SKILL.md:51`                                                                                                                     | repo     | `pnpm turbo build --filter=@kcvv/web` — a real Turbo task.                                                                                                                                                                      |
| `.claude/hooks/check-branch.sh`, `session-context.sh`, `warn-main-edits.sh`                                                                                 | repo     | No suite commands. Verified by grep for `pnpm`/`npm`/`turbo`/`vitest`/`build`/`lint`.                                                                                                                                           |
| `.claude/settings.json`                                                                                                                                     | repo     | Hooks wire only the three scripts above. No suite commands.                                                                                                                                                                     |
| `.claude/agents/kcvv-implementer.md`                                                                                                                        | repo     | 15 lines, no commands — it delegates to the AFK brief.                                                                                                                                                                          |
| `.claude/skills/doctor-plus`, `review-retro`, `effect-service-design`                                                                                       | repo     | No KCVV suite commands.                                                                                                                                                                                                         |
| `~/.claude-personal/CLAUDE.md`                                                                                                                              | personal | Statusline notes only. No suite commands.                                                                                                                                                                                       |
| Profile-level skills — `~/.claude-amexio/skills/*`, `~/.claude-personal/skills/*`, `~/personal-skills/`, `~/borrowed-skills/`, and both cloud-`synced` sets | both     | `grep -rlnE "check-all\|@kcvv/\|vr:(check\|update\|run)\|turbo (build\|test\|lint)\|test:e2e"` over all four trees returns **zero** hits. Neither profile's `settings.json` defines hooks, so there is no third hiding place.   |

## 3. The `check-all` class — one fix closes eleven rows

`pnpm --filter @kcvv/web check-all` appears in **9 files** and accounts for 11 of the 12 bypassing rows. It expands to four direct script invocations inside `apps/web`, so Turbo never sees them.

What that costs, mechanism by mechanism:

- **No cache read or write, on any of the four.** `turbo.json` carries hand-tuned `inputs` for `test` and `@kcvv/web#build` — the 3 044 VR baselines excluded so a baseline update does not bust the unit-test cache, `$TURBO_ROOT$/.husky/**` hashed so a hook edit cannot serve a cached green (#3096). None of that machinery is consulted on this route.
- **The dependency graph is skipped.** `check-all`'s `next build` does not trigger `@kcvv/studio#typegen`, so `apps/web/src/lib/sanity/sanity.types.ts` is never regenerated before the build.
- **Upstream packages are not built.** Hence the manual `corepack pnpm turbo build --filter=@kcvv/api-contract --force` step at `AFK-BRIEF.md:57`, which exists to paper over exactly this.

**Recommended replacement** (dry-run verified 2026-09-23 on `main`):

```bash
pnpm turbo run lint type-check test build --filter=@kcvv/web
```

`turbo run … --dry=json` plans:

```text
@kcvv/api-contract#build    cache HIT
@kcvv/sanity-schemas#build  cache HIT
@kcvv/studio#typegen        cache MISS  deps []
@kcvv/web#build             cache MISS  deps [api-contract#build, sanity-schemas#build, studio#typegen]
@kcvv/web#lint              cache MISS  deps [api-contract#build, sanity-schemas#build]
@kcvv/web#test              cache MISS  deps [api-contract#build, sanity-schemas#build]
@kcvv/web#type-check        cache HIT   deps [api-contract#build, sanity-schemas#build]
```

Three cache hits on a cold invocation, the two upstream builds pulled in automatically (so `AFK-BRIEF.md:57`'s manual step becomes redundant), and `@kcvv/studio#typegen` runs before the web build — which `check-all` never does.

**Two things this sweep did not measure**, and which the spec should settle rather than assume:

1. **The wall-clock saving is unquantified.** The mechanism is certain; the magnitude is not. One `turbo run … --summarize` on a warm cache settles it.
2. **Wave safety.** `check-all` runs its four steps serially; Turbo runs independent tasks in parallel. Under four concurrent `/ralph-afk` agents that is a different load profile from the one [#3090](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3090) measured. `--concurrency` exists; picking a value is a decision, not a cleanup.

A second option, if the spec prefers one name over one command: **make `check-all` a real Turbo task** and let the nine call sites stand unchanged. That trades a wider edit now for no further drift later.

### 3.1 The expand step — the filtered form, run in every workspace

[#3123](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3123) ruled for the Turbo route. [#3155](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3155) proves it before any call site moves. Measured **2026-09-26** on `origin/main` @ `1616f9d6`, in a fresh worktree:

```bash
pnpm turbo run lint type-check test build --filter="$WORKSPACE"   # e.g. @kcvv/web
```

| Workspace              | Exit | Tasks run                                                                                      | No such script (Turbo skips it) |
| ---------------------- | ---: | ---------------------------------------------------------------------------------------------- | ------------------------------- |
| `@kcvv/web`            |    0 | lint, type-check, test, build + `api-contract#build`, `sanity-schemas#build`, `studio#typegen` | —                               |
| `@kcvv/studio`         |    0 | lint, build + `sanity-studio#build`                                                            | type-check, test                |
| `@kcvv/studio-staging` |    0 | lint, build + `sanity-studio#build`                                                            | type-check, test                |
| `@kcvv/api`            |    0 | lint, type-check, test + `api-contract#build`                                                  | build                           |
| `@kcvv/sanity-schemas` |    0 | lint, type-check, build                                                                        | test                            |
| `@kcvv/sanity-studio`  |    0 | lint, type-check, test, build + `sanity-schemas#build`                                         | —                               |
| `@kcvv/api-contract`   |    0 | lint, type-check, test, build                                                                  | —                               |
| `@kcvv/sanity-ops`     |    0 | lint, type-check, test                                                                         | build                           |

**Why one command is valid in all eight.** Turbo plans a task a workspace has no script for as `<NONEXISTENT>` and skips it — not an error. So the command never needs to be tailored per workspace; only `--filter` changes.

**The seven absent scripts, and why each stays absent:**

- **`studio` / `studio-staging` — no `type-check`.** Both are red today: `tsc --noEmit` finds 11 errors in `apps/studio` and 9 in `apps/studio-staging` (`structure.ts` ×6, `sanity.config.ts` ×3 in each; `apps/studio` adds one in `scripts/` and one in `migrations/`). Neither has `tsgo` installed. Most look like two copies of `sanity`'s types meeting in one file, not bad code. Adding the script would turn the gate red, so it waits for those errors to be fixed. [#3204](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3204) owns them. Until then, `ci.yml`'s "Lint + type check Studio" step type-checks neither studio, because neither has the script.
- **`studio` / `studio-staging` — no `test`.** No test script, but not nothing to test: migrations in both studios (26 in `apps/studio`, 20 in `apps/studio-staging`) and `apps/studio/scripts/` hold logic. Both are named in `.claude/CLAUDE.md`'s test-layers table.
- **`api` — no `build`.** A Worker is bundled by `wrangler deploy` at deploy time. There is no output to build ahead.
- **`sanity-schemas` — no `test`.** Vitest's named gap ([#3100](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3100) decision D9) — decided, not shipped.
- **`sanity-ops` — no `build`.** Run by hand through `tsx`. There is no output.

**Upstream builds and typegen.** Under `--filter=@kcvv/web`, `@kcvv/api-contract#build` and `@kcvv/sanity-schemas#build` run as dependencies, and `@kcvv/studio#typegen` runs before `@kcvv/web#build` and — since this ticket — before `@kcvv/web#type-check`. Before, type-check ran in parallel with typegen and could pass on the old `sanity.types.ts`. `lint` and `test` do not read the generated types (eslint here is not type-aware; Vitest erases type-only imports). The studios' own `build` does not depend on typegen.

**A library filter checks the library, not its consumers.** `--filter=@kcvv/api-contract` passes even when the change breaks `@kcvv/web` or `@kcvv/api`. For a change to a shared package, the call site wants `--filter=...<package>` (the package and every dependent; a trailing `...` would add its dependencies instead). Which form each call site gets is [#3156](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3156)'s call.

**Cache reads and writes — one warm run.** The first run of `--filter=@kcvv/web` in the fresh worktree hit 2 of 7 and wrote the other 5 (105 s). The two early hits came from other worktrees: Turbo reports "using shared worktree cache", so every worktree on this machine reads and writes one cache. One open edge for wave safety (§3 item 2): a gitignored file such as `apps/web/.env.local` is not in the task hash, so two worktrees with different `.env.local` can serve each other's result. The next run, with `--summarize` — stdout:

```text
Tasks:    7 successful, 7 total
Cached:   7 cached, 7 total
Time:     36ms >>> FULL TURBO
```

…and per task, `cache.status` and `cache.source` read from the summary JSON (`.turbo/runs/<id>.json`):

```text
@kcvv/api-contract#build      HIT  LOCAL
@kcvv/sanity-schemas#build    HIT  LOCAL
@kcvv/studio#typegen          HIT  LOCAL
@kcvv/web#build               HIT  LOCAL
@kcvv/web#lint                HIT  LOCAL
@kcvv/web#test                HIT  LOCAL
@kcvv/web#type-check          HIT  LOCAL
```

`pnpm --filter @kcvv/web check-all` still exists and still passes on the same commit (105 s); no call site moved. `packages/sanity-studio` carries a second composite `check-all` (type-check → lint → vitest, run by hand); the contract step must remove both. The wall-clock comparison against it belongs to [#3158](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3158).

## 4. Where the per-profile guidance should live

`~/.claude-amexio/CLAUDE.md` (W6) and `~/.claude-amexio/agents/stijn.md` (W7) are the only two files outside git that carry suite commands, and both are wrong. `~/.claude-personal/` carries none.

The ticket flags that recommending the per-profile KCVV guidance move **into the repo** is a legitimate outcome. It is the right one here:

- A file in `.claude/` is loaded identically by both profiles, so the two cannot drift apart.
- It is reviewable — `/code-review` sees it, a PR can reject it.
- It is versioned against the very scripts it names, so a script rename and its documentation move in one commit.

Concretely: `~/.claude-amexio/CLAUDE.md` should be **deleted or emptied of KCVV content** — none of it applies to this repo, and it currently outranks the repo's own instructions. `stijn.md:55` should name `pnpm lint`, `pnpm type-check`, and `pnpm --filter <pkg> exec vitest run <path>`; if the Stijn agent is wanted for this repo, it belongs in `.claude/agents/`, beside `kcvv-implementer.md`.

## 5. Corrections to the ticket's own claims

Stated honestly, since the ticket asked for measurement rather than rediscovery:

- The ticket says "`~/.claude-personal/` has no such file". **It does** — `~/.claude-personal/CLAUDE.md`, dated 2026-07-13. The substance of the claim survives: the file carries no suite commands, only statusline notes. The asymmetry the ticket describes is real; the reason for it is not the file's absence.
- The ticket says `AFK-BRIEF.md:91`'s bad `vr:check` claim is in the file. It is **not committed** — `git show HEAD:` does not contain it. It exists only as an uncommitted working-tree addition on `main`.
- The ticket's profile-skill inventory predates two additions: a `bro` skill (symlinked into `~/borrowed-skills/`) in both profiles, and the cloud-`synced` sets, which **differ** between profiles (amexio: `docs`, `docx`, `import-memory`, `morning`, `pdf`, `pptx`, `skill-creator`, `xlsx`; personal adds `gauntlet-loop`, `kcvv-huisstijl`, `pixel-perfect-svg`). Re-swept: still **zero** KCVV suite commands in any of them.

## 6. Pass 2 — the handoff step

Pass 2 is blocked on the map: the spec this effort ships will change several of the commands inventoried above, and the agent layer must change with them or every wave agent keeps driving the old suite.

Per the ticket, the deliverable is **a named step in the spec's handoff**, not a second sweep ticket — the same shape as the "CLAUDE.md Is a Required Deliverable" rule already in `.claude/CLAUDE.md`. Suggested wording for the spec:

> **Update the agent layer.** For every command this spec changes, re-run the pass-1 sweep table in `docs/research/agent-layer-suite-command-sweep.md` and update each affected row in `.claude/skills/**`, `.claude/commands/**`, `.claude/agents/**` and `.claude/CLAUDE.md`. A spec that changes a suite command without this step ships a wave that runs the old one.
