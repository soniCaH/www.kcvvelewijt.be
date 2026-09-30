# Test-layer coverage audit — measured 2026-09-30

[#3277](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3277), after [#3275](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3275). Question: can a test layer report green while it skipped work? [#3276](https://github.com/soniCaH/www.kcvvelewijt.be/pull/3276) made the VR layer count itself (`vr-coverage.mjs`, `VR — Gate`); this audit does the same measurement for every other layer. Nothing here is a decision; it is the measured baseline.

**How to read a row.** _Should run_ is counted from the source tree at `833cac787` (`main` when measured). _Did run_ is counted from the log of a named CI run. `345c7a7ac` and `833cac787` differ only in docs and VR baseline PNGs, so a tree count at one is a tree count at the other. Every command is in [§4](#4-commands-that-produced-the-numbers).

**Two runs, and one caveat about the first.**

- `ci.yml` run [`36735038453`](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/36735038453) — the last green `main` run whose `Quality Checks + Build` job ran (the two newer green `main` runs were docs-only, so the job was skipped). SHA `345c7a7ac`.
- `e2e.yml` run [`36742095718`](https://github.com/soniCaH/www.kcvvelewijt.be/actions/runs/36742095718) — the last green **pull-request** run, because `e2e.yml` has no `push: main` trigger since #3151. Its head SHA differs from `main` only in non-E2E paths.
- **Caveat: in run `36735038453` 25 of the 26 distinct Turbo tasks were cache hits** (`cache hit, replaying logs`); only `@kcvv/web:build` executed. Every Vitest count below except Storybook came out of a _replayed_ log, written by the PR run with the same input hash. The count is what ran when the cache entry was written; the hit itself is sound only while the hash covers everything the tests touch. That is the subject of the Turbo row and [#3284](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3284).

## 1. One row per layer

| Layer                                        | Should run (tree)                                                                                     | Did run (run id)                                                                                                                                                                                        | Verdict                                                                                                                  | Self-count / reason                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Vitest — `apps/web`                          | 382 test files (388 `*.test/spec.*`, minus 6 Playwright specs under `test/e2e/`)                      | 382 files, 15 267 tests passed, 0 skipped (`36735038453`, `@kcvv/web:test`, cache hit `2638f0c8a25d4ecd`)                                                                                               | **covers all** (set-equal by path)                                                                                       | `test-file-coverage.mjs` (this PR)                                           |
| Vitest — `apps/api`, node pool               | 40 (`src/**/*.test.ts` minus `*.workerd.test.ts`)                                                     | 40 files (`36735038453`, `@kcvv/api:test`, cache hit `7ae7c051d6d9f96b`); 42 files / 715 tests across both pools                                                                                        | **covers all**                                                                                                           | `test-file-coverage.mjs`                                                     |
| Vitest — `apps/api`, workerd pool            | 2 (`src/**/*.workerd.test.ts`)                                                                        | 2 files, 12 tests (`[workers]` lines, same run)                                                                                                                                                         | **covers all**                                                                                                           | `test-file-coverage.mjs`                                                     |
| Vitest — `packages/api-contract`             | 6                                                                                                     | 6 files, 208 tests (`36735038453`, cache hit `97e953809a189971`)                                                                                                                                        | **covers all**                                                                                                           | `test-file-coverage.mjs`                                                     |
| Vitest — `packages/sanity-studio`            | 56                                                                                                    | 56 files, 379 tests (`36735038453`, cache hit `21f0be264ad1ca0d`)                                                                                                                                       | **covers all**                                                                                                           | `test-file-coverage.mjs`                                                     |
| Vitest — `scripts/sanity-ops`                | 2                                                                                                     | 2 files, 15 tests (`36735038453`, cache hit `03b63156d3014f8d`)                                                                                                                                         | **covers all**                                                                                                           | `test-file-coverage.mjs`                                                     |
| `test:storybook` (addon-vitest `play`)       | 209 story files; 1 142 story entries tagged `test` in the built `index.json`                          | 209 files, 1 142 tests passed (`36735038453`; not a Turbo task, it really ran)                                                                                                                          | **covers all**                                                                                                           | `test-file-coverage.mjs` (files); story level: see [§2.3](#23-teststorybook) |
| E2E (Playwright)                             | 6 `*.spec.ts` files, 54 tests (`playwright test --list`)                                              | 6 files, 54 tests: 53 passed, 1 skipped by design (`tap-targets.spec.ts:313`, `test.skip(viewport.width < 1024)`) (`36742095718`, PR run)                                                               | **tests: covers all. Trigger filter: [gap found #3285](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3285)**      | `test-file-coverage.mjs` (files); filter gap ticketed                        |
| Static — ESLint                              | 8 workspaces with a `lint` script; 1 331 tracked JS/TS files in `apps/web`, 377 in the other 7        | 8 of 8 `lint` tasks (`36735038453`, all cache hits). Files linted, from running the same command at `833cac787`: 1 301 of 1 331 in `apps/web` (30 ignored), 377 of 377 elsewhere                        | **covers all**, with 30 declared ignores (29 under `apps/web/scripts/`, 1 generated `sanity.types.ts`)                   | Reason in [§2.4](#24-static)                                                 |
| Static — type-check                          | 8 workspaces with a `type-check` script; 1 666 tracked `.ts/.tsx/.mts/.cts` files (excluding `.d.ts`) | 7 of 8 tasks (`api-contract` is checked by `build`, deliberately). Files in a program, from `tsgo --listFilesOnly` at `833cac787`: 1 658 of 1 666                                                       | **[gap found #3286](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3286)**: 8 files in no program                  | Self-count waits for the fix ticket ([§2.4](#24-static))                     |
| Static — shellcheck (`lint:sh`)              | 13 tracked shell scripts (`*.sh` + extension-less `.husky/*` hooks)                                   | 12 (the step's own `git ls-files` list at `345c7a7ac`; the step prints nothing on success)                                                                                                              | **[gap found #3283](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3283)**: `.husky/branch-guard.sh`               | Self-count waits for the fix ticket ([§2.4](#24-static))                     |
| Static — knip                                | 10 `package.json` files tracked                                                                       | 10 workspaces in knip's "Included workspaces" (`--debug`, run at `833cac787`)                                                                                                                           | **covers all**                                                                                                           | No filter to count; reason in [§2.4](#24-static)                             |
| Build                                        | 6 workspaces with a `build` script                                                                    | 5: `web`, `studio`, `api-contract`, `sanity-schemas`, `sanity-studio` (`36735038453`). `web:build` was the run's one cache miss. Storybook builds in its own job (`Build Storybook`, same run, success) | **[gap found #3287](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3287)**: `studio-staging` never builds          | Ticket carries the decision                                                  |
| Sanity typegen gate (`Sanity types in sync`) | 30 `defineQuery` calls in `apps/web/src/lib/repositories/*.ts`; 1 schema                              | 30 `// Source` query blocks + the schema in the committed `sanity.types.ts`; `@kcvv/studio:typegen` cache hit `a42278fef13c4c83`, then a real `git diff --exit-code` (`36735038453`)                    | **covers all**                                                                                                           | Reason in [§2.5](#25-sanity-typegen-gate)                                    |
| Turbo cache (cuts across every Vitest row)   | 5 `test` tasks                                                                                        | 5 of 5 were cache hits                                                                                                                                                                                  | **[gap found #3284](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3284)**: 4 spawned scripts are outside the hash | Ticket carries the fix                                                       |

`0 skipped` for Vitest: each summary line reads `N passed (N)` with no `skipped` or `todo` term.

## 2. Notes per layer

### 2.1 Vitest — the split and the filters

The three places where Vitest's own include can drop a file silently:

- `apps/api/vitest.config.ts` runs two `projects`: node (`src/**/*.test.ts`, minus `src/**/*.workerd.test.ts`) and workers (`src/**/*.workerd.test.ts`). A `src/x.test.tsx`, an `x.spec.ts`, or a test outside `src/` matches neither.
- `packages/api-contract` (`src/**/*.test.ts`) and `packages/sanity-studio` (`src/**/*.test.ts`, `src/**/*.test.tsx`) name an include. `scripts/sanity-ops` and `apps/web` use Vitest's default, which `apps/web` narrows with an `exclude` for `test/e2e/`.
- **Confirmed from behaviour, not from reading:** a config whose `include` matches nothing exits 1 (`No test files found, exiting with code 1`, tried on `packages/api-contract` with a scratch config, then deleted). No workspace sets `passWithNoTests`. That guards the empty case only: a config that still matches one file but not the one you just added exits 0. The self-count covers that case, and was shown red by renaming `apps/api/src/psd/venue.test.ts` to `venue.test.tsx` (PR description).

Every Vitest row above was also compared file by file, not only by count: the set of paths in the log's `✓` lines equals the set of tracked test files in each workspace (0 tracked-not-ran, 0 ran-not-tracked).

The `apps/web` row says 382 because that is the tree at `833cac787`. This PR adds `apps/web/test/scripts/test-file-coverage.test.ts`, so the script on the merge commit prints `383 tracked, 383 listed` for that layer; the extra file is the self-count's own test.

### 2.2 E2E

`playwright.config.ts` declares one project (`chromium`), `testDir: "."` and `testMatch: "**/*.spec.ts"`; `forbidOnly` is on in CI. All 6 tracked specs ran. The one skip is a per-viewport guard in the spec, visible in the diff.

The **trigger** is where work is skipped: `e2e.yml`'s `changes` job lists paths, and a job skipped by `if:` reports success on the required `E2E` check. Five of the 346 commits on `main` since 2026-08-15 touched only build inputs the list omits — [#3285](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3285). The filter stays at job level; the ticket proposes widening the list, never moving it to `on:`.

### 2.3 `test:storybook`

Stories are discovered through `.storybook/main.ts`'s `stories` glob (`../src/**/*.mdx`, `../src/**/*.stories.@(js|jsx|mjs|ts|tsx)`), not Vitest's globbing. 209 tracked story files, 209 listed by `vitest list --config vitest.storybook.config.ts`, 209 ran. A story file outside the glob (any `.stories.*` outside `src/`, or a `.cjs` extension) would fail the self-count.

Story level: a fresh `storybook build` at `833cac787` gives 1 357 index entries, 1 142 of type `story`, all 1 142 tagged `test`, none tagged `skip`; 1 142 tests ran. A story tagged `!test` would be skipped by the addon; none is, and the tag is an explicit per-story opt-out that shows in the diff. Counting it in CI would need the built `index.json`, which only the separate `Build Storybook` job has; `VR — Gate` already reads that artifact for VR. Not built here.

### 2.4 Static

- **ESLint.** The only filter is `ignores` in each `eslint.config.mjs`. `apps/web` ignores `scripts/**` (29 tracked files, deliberately; `lint-staged` also skips them) and the generated `sanity.types.ts`. A count would restate the config, so there is no self-count; a new ignore is a one-line diff in a file that already documents each entry. 27 tracked JS/TS files sit outside any workspace (`.design-sync/`, `docs/design/mockups/`, three root `scripts/*.mjs`, `commitlint.config.js`) and are linted by no task. They are run-by-hand tools and throwaway mockup scripts.
- **type-check.** The filter is each tsconfig's `include`. Gap ticketed ([#3286](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3286)). A self-count would be red on `main` today, so it belongs with the fix.
- **shellcheck.** The filter is a git pathspec whose exclusion cancels one `*.sh` include. Gap ticketed ([#3283](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3283)). Same reasoning: the self-count lands with the pathspec fix. `.claude/CLAUDE.md`'s "Shell Scripts Are Linted" paragraph claimed every tracked `*.sh` file; it now names the exception.
- **knip.** Nothing to split: it discovers workspaces from `pnpm-workspace.yaml` (10 of 10). `knip.jsonc` runs only the dependency and binary detectors, so it cannot skip a file the way the others can.

### 2.5 Sanity typegen gate

`sanity.cli.ts` reads `../web/src/lib/repositories/*.ts`; `turbo.json`'s `@kcvv/studio#typegen` inputs list the same glob plus the schema sources, so the cache key matches what the command reads. The repository folder has no subdirectories, and 30 `defineQuery` calls produce 30 generated query types. The step then runs `git diff --exit-code` on the restored output, which is real work even when `typegen` itself is a cache hit. The remaining GROQ in the app (`fetchGroq` in `legacy-redirect.ts`) is plain strings on purpose, untyped. No self-count: a query added outside that folder has no generated type and fails `type-check` instead of skipping.

## 3. What the audit changed

- New CI step **`Every test file is picked up by a runner`** in `Quality Checks + Build` (no new required check): `node apps/web/scripts/test-file-coverage.mjs`. Every tracked test or story file in the repo must be owned by one of its layers, and each layer asks its runner which files it would run; a file no layer owns, a file its runner does not list, a layer that owns nothing and a runner that lists nothing all fail. It lists; it does not run tests, so it adds seconds, not a test run.
- Five tickets, all `needs-triage`: [#3283](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3283) (shellcheck), [#3284](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3284) (Turbo hash), [#3285](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3285) (E2E filter), [#3286](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3286) (type-check program), [#3287](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3287) (studio-staging build).
- `.claude/CLAUDE.md`: test-layer table footnote for the new step; the `lint:sh` paragraph corrected.
- [`test-suite-inventory.md`](./test-suite-inventory.md) is a dated baseline and stays as written. Its E2E figures (7 specs, 56 tests) differ from the 6 specs and 54 tests measured here because #3190 deleted two specs after 2026-09-22, not because either count is wrong; its Vitest file counts (web 370, api 39, sanity-studio 46, api-contract 5) have grown (382, 42, 56, 6).

### Self-count shown red, then green

Red: three strays added locally and never committed: `packages/sanity-schemas/src/validation/stray.test.ts` (a workspace no layer covers), `apps/web/test/e2e/x.test.ts` (under Playwright's directory, but not a `*.spec.ts`), and `apps/api/src/psd/venue.test.ts` renamed to `venue.test.tsx` (matches neither API include; plain `vitest run` stays green).

```text
::error::1 tracked test file(s) belong to no layer of scripts/test-file-coverage.mjs: packages/sanity-schemas/src/validation/stray.test.ts
web unit (Vitest): every tracked file is listed (383 tracked, 383 listed).
web Storybook play (Vitest addon): every tracked file is listed (209 tracked, 209 listed).
::error::web E2E (Playwright): 1 tracked file(s) no runner lists: apps/web/test/e2e/x.test.ts
::error::api (Vitest node + workerd): 1 tracked file(s) no runner lists: apps/api/src/psd/venue.test.tsx
api-contract (Vitest): every tracked file is listed (6 tracked, 6 listed).
sanity-studio (Vitest): every tracked file is listed (56 tracked, 56 listed).
sanity-ops (Vitest): every tracked file is listed (2 tracked, 2 listed).
exit=1
```

Green: strays removed, file restored.

```text
web unit (Vitest): every tracked file is listed (383 tracked, 383 listed).
web Storybook play (Vitest addon): every tracked file is listed (209 tracked, 209 listed).
web E2E (Playwright): every tracked file is listed (6 tracked, 6 listed).
api (Vitest node + workerd): every tracked file is listed (42 tracked, 42 listed).
api-contract (Vitest): every tracked file is listed (6 tracked, 6 listed).
sanity-studio (Vitest): every tracked file is listed (56 tracked, 56 listed).
sanity-ops (Vitest): every tracked file is listed (2 tracked, 2 listed).
exit=0
```

## 4. Commands that produced the numbers

```bash
# Logs
gh run list --workflow ci.yml --branch main --status success --limit 5 --json databaseId,headSha
gh run view 36735038453 --json jobs --jq '.jobs[]|"\(.name) \(.conclusion)"'
gh run view 36735038453 --log > /tmp/kcvv-3277/main.log     # Quality Checks + Build steps
gh run view 36742095718 --log > /tmp/kcvv-3277/e2e.log      # last green E2E (PR run)

# Did run: Vitest summary per workspace, and the ✓ file lines
grep -E "Test Files|Tests " main.log
grep -E "✓|❯" main.log | grep -oE "[^ ]+\.(test|spec|stories)\.[cm]?[jt]sx?"
# Turbo hit/miss
grep -c "cache hit, replaying" main.log ; grep -c "cache miss, executing" main.log
grep -o "##\[group\]@kcvv/[a-z-]*:[a-z-]*" main.log | sort | uniq -c

# Should run: tracked files per layer (run from the repo root)
git ls-files apps/web | grep -E '\.(test|spec)\.[cm]?[jt]sx?$' | grep -v '^apps/web/test/e2e/' | wc -l
git ls-files apps/api | grep -E '\.workerd\.test\.ts$' | wc -l
git ls-files apps/web | grep -E '\.stories\.[cm]?[jt]sx?$' | wc -l
git ls-files -z '*.sh' '.husky/*' ':!:.husky/*.*' | tr '\0' '\n' | wc -l     # what lint:sh is given
git ls-files '*.sh' | wc -l    # 10, plus .husky/commit-msg, pre-commit, pre-merge-commit = 13 shell scripts
git ls-files '*/package.json' | xargs grep -l '"build":' | wc -l             # 6 workspaces with a build script
grep -o 'defineQuery(' apps/web/src/lib/repositories/*.ts | wc -l            # 30 queries typegen should read
grep -c '^// Source: \.\./web/' apps/web/src/lib/sanity/sanity.types.ts      # 30 generated query blocks

# What each runner would run
pnpm exec vitest list --filesOnly                                   # in each Vitest workspace
pnpm exec vitest list --filesOnly --config vitest.storybook.config.ts   # apps/web
pnpm exec playwright test -c test/e2e/playwright.config.ts --list   # apps/web
pnpm exec eslint . -f json                                          # files linted, per workspace
pnpm exec tsgo --noEmit --listFilesOnly -p .                        # files in the type-check program
pnpm exec knip --include dependencies,devDependencies,optionalPeerDependencies,unlisted,binaries --debug
pnpm exec storybook build -o /tmp/kcvv-3277/sb                      # then count index.json entries

# Turbo hash sensitivity (append a line to one file, compare, git checkout the file)
pnpm exec turbo run test --filter=@kcvv/web --dry=json

# Empty include still fails (scratch config, deleted after)
pnpm exec vitest run --config scratch-empty.config.ts               # exit 1

# The self-count
node apps/web/scripts/test-file-coverage.mjs
```
