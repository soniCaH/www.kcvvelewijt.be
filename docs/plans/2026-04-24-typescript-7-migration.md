# TypeScript 7.0 Beta Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Swap our monorepo's type-check pipeline from classic `tsc` to the Go-based `tsgo` compiler (`@typescript/native-preview@beta`) to cut wall-clock type-check time ~10× on lint-staged, CI, and the local dev loop.

**Architecture:** Dual-install pattern. Keep classic `typescript@6.0.3` installed in every workspace (required by `typescript-eslint`, `knip`, Sanity typegen, Next's internal build-time check). Add `@typescript/native-preview` as a dev dep only in the 5 workspaces whose `type-check`/`build` scripts we are rewriting to call `tsgo`. Leave `apps/web/next.config.ts` untouched so `next build` still runs its classic `tsc` pass for typed-route safety.

**Tech Stack:** Node 22 / pnpm 10.33 / Turborepo 2.9 / TypeScript 6.0.3 / `@typescript/native-preview` (tsgo) / Vitest 4 / Next 16 / Wrangler 4

**Design Reference:** `docs/plans/2026-04-24-typescript-7-migration-design.md`

---

## Ground Rules for Every Task

- Work in the worktree at `/Users/kevinvanransbeeck/Sites/KCVV/kcvv-typescript-7-beta/` on branch `chore/typescript-7-beta`.
- One workspace per commit. Conventional commit type = `chore`, scope = `deps` (or `config` for CI/turbo touches).
- After every workspace switch, run that workspace's `type-check` (and `build` where applicable) and paste the exit status + wall-clock into the task completion notes.
- If `tsgo` produces a different error set than `tsc` on the same tree, STOP and escalate — semantics must match TS 6.0 exactly.
- Never commit directly to `main`.

---

### Task 0: Baseline timing capture (no code change)

**Why:** We need "before" numbers to validate the 10× claim and to include in the PR body.

**Files:** None.

**Step 0.1: Verify worktree baseline is clean**

```bash
cd /Users/kevinvanransbeeck/Sites/KCVV/kcvv-typescript-7-beta
git status
git log --oneline -3
```

Expected: working tree clean; HEAD on `chore/typescript-7-beta` with the design-doc commit on top of `526d1e86`.

**Step 0.2: Install baseline dependencies**

```bash
pnpm install
```

Expected: "Done" with no errors. (pnpm store is shared so should be near-instant.)

**Step 0.3: Time classic `tsc --noEmit` per workspace**

```bash
for W in @kcvv/api-contract @kcvv/sanity-schemas @kcvv/sanity-studio @kcvv/api @kcvv/web; do
  echo "=== $W ==="
  time pnpm --filter "$W" type-check
done
```

Record each wall-clock time. Paste the block into the PR scratchpad (`docs/plans/2026-04-24-typescript-7-migration-timings.md` — created at Task 9).

**Step 0.4: Time `tsc --build` for api-contract**

```bash
rm -rf packages/api-contract/dist packages/api-contract/tsconfig.tsbuildinfo
time pnpm --filter @kcvv/api-contract build
ls packages/api-contract/dist | head
```

Record timing. Capture the file list — we'll diff it against the `tsgo --build` output in Task 2.

**Step 0.5: Snapshot the classic dist for diff**

```bash
cp -r packages/api-contract/dist /tmp/api-contract-dist-tsc
```

No commit.

---

### Task 1: Install `@typescript/native-preview` and verify `tsgo` binary

**Files:**
- Modify: `apps/web/package.json` (devDependencies)
- Modify: `apps/api/package.json` (devDependencies)
- Modify: `packages/api-contract/package.json` (devDependencies)
- Modify: `packages/sanity-schemas/package.json` (devDependencies)
- Modify: `packages/sanity-studio/package.json` (devDependencies)
- Modify: `pnpm-lock.yaml` (auto)

**Step 1.1: Add the beta package to each target workspace**

```bash
pnpm --filter @kcvv/api-contract add -D @typescript/native-preview@beta
pnpm --filter @kcvv/sanity-schemas add -D @typescript/native-preview@beta
pnpm --filter @kcvv/sanity-studio add -D @typescript/native-preview@beta
pnpm --filter @kcvv/api add -D @typescript/native-preview@beta
pnpm --filter @kcvv/web add -D @typescript/native-preview@beta
```

Expected: each `package.json` now shows a pinned version (e.g. `"@typescript/native-preview": "7.0.0-beta.N"`).

**Step 1.2: Verify the `tsgo` binary resolves in every target workspace**

```bash
for W in @kcvv/api-contract @kcvv/sanity-schemas @kcvv/sanity-studio @kcvv/api @kcvv/web; do
  echo "=== $W ==="
  pnpm --filter "$W" exec tsgo --version
done
```

Expected: prints a `7.0.0-beta.*` version in every workspace. If any workspace prints "command not found", pnpm did not hoist the bin — add `@typescript/native-preview` to that workspace's `devDependencies` explicitly and re-run.

**Step 1.3: Verify classic `typescript` is still resolvable**

```bash
pnpm --filter @kcvv/web exec tsc --version
```

Expected: `Version 6.0.3`. (Dual-install sanity check.)

**Step 1.4: Commit**

```bash
git add apps/web/package.json apps/api/package.json packages/api-contract/package.json packages/sanity-schemas/package.json packages/sanity-studio/package.json pnpm-lock.yaml
git commit -m "chore(deps): add @typescript/native-preview (tsgo) beta

Installs the Go-based TypeScript compiler alongside classic tsc.
No scripts switched yet — this commit is additive.
"
```

---

### Task 2: Switch `packages/api-contract` (composite + project-refs pressure test)

**Why first:** This is the only workspace using `tsc --build` and the only one exercising composite project references. If `tsgo --build` breaks here, the entire plan needs reconsidering.

**Files:**
- Modify: `packages/api-contract/package.json:11-17` (scripts block)

**Step 2.1: Rewrite the scripts**

In `packages/api-contract/package.json`, change the `scripts` block to:

```json
"scripts": {
  "type-check": "tsgo --noEmit",
  "build": "tsgo --build",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Step 2.2: Run type-check**

```bash
cd /Users/kevinvanransbeeck/Sites/KCVV/kcvv-typescript-7-beta
time pnpm --filter @kcvv/api-contract type-check
```

Expected: exit 0, no diagnostics. Record wall-clock.

**Step 2.3: Clean + run build, diff against baseline**

```bash
rm -rf packages/api-contract/dist packages/api-contract/tsconfig.tsbuildinfo
time pnpm --filter @kcvv/api-contract build
diff -r /tmp/api-contract-dist-tsc packages/api-contract/dist
```

Expected: `diff` prints nothing, OR only whitespace/sourcemap `file` field differences (acceptable). Record wall-clock.

**If the diff shows declaration-content differences:** STOP. This would mean tsgo emits different `.d.ts` than tsc — a regression consumers would notice. Escalate.

**Step 2.4: Sanity-check the consumers still type-check against the new dist**

```bash
time pnpm --filter @kcvv/web type-check  # still on tsc in this task
time pnpm --filter @kcvv/api type-check  # still on tsc in this task
```

Expected: both exit 0.

**Step 2.5: Commit**

```bash
git add packages/api-contract/package.json
git commit -m "chore(deps): switch api-contract type-check + build to tsgo

Composite project references and declaration emit verified byte-equivalent
to tsc --build (see docs/plans/2026-04-24-typescript-7-migration-timings.md).
"
```

---

### Task 3: Switch `packages/sanity-schemas`

**Files:**
- Modify: `packages/sanity-schemas/package.json:12-15` (scripts block, `type-check` + `build`)

**Step 3.1: Rewrite**

```json
"scripts": {
  "type-check": "tsgo --noEmit",
  "build": "tsgo --noEmit"
}
```

(Keeps the existing `build = type-check` aliasing — Turbo task has `"outputs": []` so no artifact drift.)

**Step 3.2: Verify**

```bash
time pnpm --filter @kcvv/sanity-schemas type-check
time pnpm --filter @kcvv/sanity-schemas build
```

Expected: both exit 0. Record wall-clock.

**Step 3.3: Commit**

```bash
git add packages/sanity-schemas/package.json
git commit -m "chore(deps): switch sanity-schemas type-check to tsgo"
```

---

### Task 4: Switch `packages/sanity-studio`

**Files:**
- Modify: `packages/sanity-studio/package.json:17` (`type-check` line)

**Step 4.1: Rewrite**

Change `"type-check": "tsc --noEmit"` → `"type-check": "tsgo --noEmit"`. The `build` script delegates via `pnpm type-check` (unchanged).

**Step 4.2: Verify**

```bash
time pnpm --filter @kcvv/sanity-studio type-check
time pnpm --filter @kcvv/sanity-studio build
time pnpm --filter @kcvv/sanity-studio check-all
```

Expected: each exits 0. Record wall-clock.

**Step 4.3: Commit**

```bash
git add packages/sanity-studio/package.json
git commit -m "chore(deps): switch sanity-studio type-check to tsgo"
```

---

### Task 5: Switch `apps/api`

**Files:**
- Modify: `apps/api/package.json:10` (`type-check` line)

**Step 5.1: Rewrite**

Change `"type-check": "tsc --noEmit"` → `"type-check": "tsgo --noEmit"`.

**Step 5.2: Verify**

```bash
time pnpm --filter @kcvv/api type-check
time pnpm --filter @kcvv/api test
```

Expected: both exit 0. Record wall-clock.

**Step 5.3: Commit**

```bash
git add apps/api/package.json
git commit -m "chore(deps): switch api type-check to tsgo"
```

---

### Task 6: Switch `apps/web` (the big one — includes `.next/types/**` includes)

**Files:**
- Modify: `apps/web/package.json:11` (`type-check` line)

**Step 6.1: Prime Next's generated types**

`apps/web/tsconfig.json` `include`s `.next/types/**/*.ts` and `.next/dev/types/**/*.ts`. On a fresh worktree these do not exist yet — tsgo will complain about missing typed-route imports. Prime them once:

```bash
cd /Users/kevinvanransbeeck/Sites/KCVV/kcvv-typescript-7-beta
pnpm --filter @kcvv/web exec next build  # generates .next/types
```

Expected: `next build` succeeds. (Slow — this is the one-time priming cost.)

**Step 6.2: Rewrite the script**

Change `"type-check": "tsc --noEmit"` → `"type-check": "tsgo --noEmit"`.

**Step 6.3: Verify**

```bash
time pnpm --filter @kcvv/web type-check
```

Expected: exit 0. Record wall-clock. If tsgo reports typed-route errors that `tsc` did not, the `.next/types` priming is stale — rerun `next build` and retry. If errors persist, STOP and escalate — this is the documented Next.js interaction we chose not to work around.

**Step 6.4: Run the full check-all chain**

```bash
time pnpm --filter @kcvv/web check-all
```

Expected: lint → type-check → test → build all pass. This is the canonical pre-PR verification.

**Step 6.5: Commit**

```bash
git add apps/web/package.json
git commit -m "chore(deps): switch web type-check to tsgo

Next.js keeps its internal tsc pass during next build — tsgo runs as
the standalone type-check gate. .next/types/** is primed by next build
before tsgo runs (as it already is in CI and on Vercel).
"
```

---

### Task 7: Full-monorepo verification

**Files:** None.

**Step 7.1: Root `type-check`**

```bash
time pnpm type-check
```

Expected: all 5 workspaces exit 0. Record wall-clock.

**Step 7.2: Root `build`**

```bash
time pnpm build
```

Expected: all workspaces build. Record wall-clock.

**Step 7.3: Lint + tests**

```bash
pnpm lint
pnpm test
```

Expected: both green.

**Step 7.4: Knip sanity check (compiler-API tool)**

```bash
pnpm knip 2>&1 | tail -20
```

Expected: exits 0 or with the same warnings it had on main (no *new* unresolved imports).

No commit — data only.

---

### Task 8: Update `.claude/CLAUDE.md`

**Why:** The in-repo rule says "CLAUDE.md Is a Required Deliverable" when the architecture description changes. The type-check toolchain is exactly that.

**Files:**
- Modify: `.claude/CLAUDE.md` (add a short note under "Development Guidelines")

**Step 8.1: Add this block under "Development Guidelines"**

````markdown
### TypeScript Compiler — Dual-Install (tsgo + tsc)

`@typescript/native-preview` (`tsgo`) is the primary type-checker and runs every `type-check` and `apps/api-contract` `build` script. Classic `typescript` (`tsc`) stays installed because `typescript-eslint`, `knip`, `@sanity/cli` typegen, and Next.js's `next build` all resolve the `typescript` package name and consume its (unstable) compiler API. Do not remove `typescript` from any workspace. Revisit this split after TypeScript 7.0 GA (est. July 2026).
````

**Step 8.2: Commit**

```bash
git add .claude/CLAUDE.md
git commit -m "docs(config): document tsgo + tsc dual-install in CLAUDE.md"
```

---

### Task 9: Timings scratchpad + PR

**Files:**
- Create: `docs/plans/2026-04-24-typescript-7-migration-timings.md`

**Step 9.1: Record timings**

Fill in the table from data collected in Tasks 0 and 2–7:

```markdown
# TS 7 Migration — Measured Timings

| Command | Classic tsc (baseline) | tsgo (this branch) | Speedup |
| --- | --- | --- | --- |
| pnpm --filter @kcvv/api-contract type-check | <0.3> | <0.3> | |
| pnpm --filter @kcvv/api-contract build      | <0.4> | <2.3> | |
| pnpm --filter @kcvv/sanity-schemas type-check | ... | ... | |
| pnpm --filter @kcvv/sanity-studio type-check  | ... | ... | |
| pnpm --filter @kcvv/api type-check           | ... | ... | |
| pnpm --filter @kcvv/web type-check           | ... | ... | |
| pnpm --filter @kcvv/web check-all            | ... | ... | |
| pnpm type-check (root)                       | ... | ... | |
```

**Step 9.2: Commit**

```bash
git add docs/plans/2026-04-24-typescript-7-migration-timings.md
git commit -m "docs(deps): record tsgo vs tsc timings"
```

**Step 9.3: Push + open PR**

```bash
git push -u origin chore/typescript-7-beta
gh pr create --title "chore(deps): adopt @typescript/native-preview (tsgo) as primary type-checker" --body "$(cat <<'EOF'
## Summary
- Swaps every workspace's `type-check` script (and `packages/api-contract`'s `build`) from classic `tsc` to `tsgo` (Go-based, ~10× faster).
- Keeps classic `typescript@6.0.3` installed in every workspace — `typescript-eslint`, `knip`, Sanity typegen, and Next's internal `next build` all depend on the `typescript` package name.
- Next.js's internal type-check during `next build` intentionally stays on classic `tsc` until TypeScript 7.0 GA (est. July 2026) — typed-route generation into `.next/types/**` makes a pre-build `tsgo` gate fragile.

## Design doc
`docs/plans/2026-04-24-typescript-7-migration-design.md`

## Timings
See `docs/plans/2026-04-24-typescript-7-migration-timings.md`.

## Test plan
- [ ] `pnpm type-check` exits 0
- [ ] `pnpm build` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm --filter @kcvv/web check-all` exits 0
- [ ] Vercel preview deployment succeeds
- [ ] CI `type-check` jobs for web, api, studio all green
- [ ] `pnpm knip` shows no *new* unresolved-import warnings vs main

## Rollback
`git revert` the merge commit + `pnpm install`. No schema/data/infra changes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed. Return it to the user.

---

## Done definition

- [ ] All 10 tasks committed on branch `chore/typescript-7-beta`.
- [ ] Root `pnpm type-check`, `pnpm build`, `pnpm lint`, `pnpm test` all pass.
- [ ] Timings table shows measurable speedup on the main paths.
- [ ] PR opened against `main`, CI green.
- [ ] `.claude/CLAUDE.md` updated.
