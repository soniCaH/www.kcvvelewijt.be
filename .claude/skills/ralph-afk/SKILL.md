---
name: ralph-afk
description: Spawn a wave of parallel agents to implement unblocked `ready` issues, one git worktree each, then review the branches they open. Use for ralph afk, running a wave, reviewing wave branches, or working the issue queue unattended.
argument-hint: "[issue-number...]"
---

# Ralph AFK

Run the queue while the user is away. Pick the currently-unblocked `ready` issues, spawn one autonomous agent per issue in its own worktree (in parallel, in one message), review the draft PRs they open, and report the URLs as they land.

Sequential human-in-the-loop counterpart: `/ralph` (`.claude/commands/ralph.md`) and `scripts/ralph.sh`. Brief template: [AFK-BRIEF.md](AFK-BRIEF.md).

This skill follows `/ralph`'s conventions — same `blockedBy` gate, same worktree paths, same quality gate, same TDD loop — and where one here disagrees with `.claude/commands/ralph.md`, that file wins.

Two things differ on purpose, because a wave is not one issue at a time. Both live in step 5: the last gate runs at the orchestrator instead of inside the worker, and agents leave the issue on `in-progress` for the orchestrator to flip. Keep this paragraph honest — a stale parity claim is worse than no claim.

## The wave's shared-resource register

**A wave guards named shared resources, never CPU** (#3090, #3124, #3141). Four real concurrent `check-all` chains cost 1.67× per lane and bought a **2.4× throughput win** — nothing is bought by capping the wave, so it stays at **4 agents at every task runner's default worker count. No worker-count or concurrency cap is adopted.** Every real wave failure came from something shared _outside_ the worktree instead — separate worktrees isolate the filesystem and nothing else:

| #   | Resource                                                                                                    | Guard                                                                                                                                                                                                        | Closed by     |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| 1   | Fixed TCP ports (a per-process counter that restarts at 0 in every worktree)                                | An ephemeral port (`listen(0)` → read the assigned port → close → use it) + a `no-restricted-syntax` ban on `.listen(` in test files                                                                         | #3109 / #3127 |
| 2   | The visual-regression Docker image build                                                                    | Built **once**, in step 0 below, before the wave — never inside a lane. `apps/web/scripts/vr-docker.mjs` no longer passes `--build`; it fails fast, naming the exact build command, when the image is absent | #3141         |
| 3   | The visual-regression container                                                                             | An exclusive lock — a `mkdir`-based mutex in `vr-docker.mjs`, because an agent can skim a brief and cannot skim a lock. A second caller is refused with a clear message, not queued                          | #3141         |
| 4   | The Docker Compose project name (derived from the working-directory basename, so every worktree shares one) | Already closed by #3 above — the lock makes the VR lane exclusive, so two Compose projects sharing that name can never run at once                                                                           | #3124         |
| 5   | The e2e dev server's TCP port under Playwright's `webServer.reuseExistingServer`                            | Each worktree derives its own port from its own absolute path (`apps/web/test/e2e/playwright.config.ts`'s `webServer` block, via `apps/web/scripts/e2e-dev-port.mjs`)                                        | #3141         |

**A separate rule, not a register member:** at most one issue per wave may touch visual-regression baselines — see "Visual-regression baselines" in the collision-class table below. That rule is about **merge conflicts** on the committed PNGs, not run-time contention, and it would not by itself have prevented the 2026-09-21 Docker image-build freeze or a container memory fight.

## Process

**You** run every step here, in the main checkout, as the orchestrator. Spawned agents run only what their brief tells them, inside their own worktree — they never call `unblocked-issues.sh` or `wave-check.sh`. Both scripts are repo-root-relative, so run them from the repository root; they need `gh` and `git` on PATH and nothing else.

### 0. Prune merged worktrees

Prior runs leave worktrees behind. Garbage-collect the merged ones before computing the wave:

```bash
source ~/.nvm/nvm.sh && nvm use >/dev/null 2>&1
git fetch --prune origin
git worktree list
```

For each `../kcvv-issue-<N>`, name the branch explicitly — a bare `gh pr view` reads the _current_ branch, which here is whatever the main checkout is on, not the worktree's:

```bash
gh pr view "feat/issue-<N>" --json state,url --jq '.state'
```

When that prints `MERGED`:

```bash
git worktree remove ../kcvv-issue-<N> --force
git branch -d feat/issue-<N>   # safe — refuses if unmerged
```

Leave worktrees whose PR is still open — those are under review. Report what you pruned.

Two traps:

- **Look before removing.** `--force` discards uncommitted work without asking. `git -C ../kcvv-issue-<N> status --porcelain` must print nothing first.
- **A squash-merged branch makes `git branch -d` refuse**, because the squashed commit's patch-id does not match the branch's own commits. That refusal is not evidence work would be lost. Confirm the content actually landed, then force:

```bash
M=$(gh pr view "feat/issue-<N>" --json mergeCommit --jq '.mergeCommit.oid')
git merge-base --is-ancestor "$M" origin/main && git branch -D feat/issue-<N>
```

### 0a. Build the visual-regression image once

Register member 2 above. Do this **once per wave, here, never inside a lane** — a rebuild racing another lane's is the 2026-09-21 sixteen-minute freeze:

```bash
pnpm --filter @kcvv/web run vr:build-image
```

Safe to skip only when you are certain no issue in this wave will touch a VR-tagged story or call `vr:check`/`vr:update*` — a stale or missing image just makes the first such call in the wave fail fast, naming this same command in its error.

### 0b. Report the human-only queue

Operational follow-ups — a migration to run, a flag to flip, a KV namespace to create — ship _inside_ code PRs and leave no trace once the PR is merged and its body stops being read. Print them before computing the wave, because this is the one moment the user is already in this context:

```bash
gh issue list --label ready-for-human --state open --json number,title --jq '.[] | "#\(.number) \(.title)"'
```

Report that list above the proposed wave. `ready-for-human` (`docs/agents/triage-labels.md`) marks work the human implements — it carries no `ready` label, so step 1's gate already keeps it out of the wave.

The other half of the rule: when a wave's own work ships an operational step, **file it as an issue labelled `ready-for-human` before closing the branch**. A note in a PR body is not tracking. #2871 exists because a migration shipped unrun with only a PR-body mention, and nothing would have surfaced it again.

### 1. Determine the wave

If the user passed explicit issue numbers, put each one through the same gate the automatic path uses — a named issue is not a pre-approved one:

```bash
gh issue view <N> --json state,labels --jq '"\(.state) \([.labels[].name] | join(","))"'
```

Keep it only when the state is `OPEN`, the labels include `ready`, and `./scripts/unblocked-issues.sh` lists it. Anything else stops with the reason, per the hard rules below.

Otherwise build the wave automatically:

1. Get the eligible set. Both gates — the `ready` label and zero open blockers — live in one script, which `scripts/ralph.sh` and `/ralph` use too:

   ```bash
   ./scripts/unblocked-issues.sh
   ```

   It prints every eligible issue number, ascending. A **nonzero exit** means a `blockedBy` query failed and the set is incomplete — report that and stop, rather than building a wave from a partial queue.

2. Read the titles, so you can judge scope and collisions:

   ```bash
   gh issue view <N> --json number,title,milestone --jq '"\(.number) · \(.title) · \(.milestone.title // "no milestone")"'
   ```

3. **Mutually compatible** = drop pairs that would collide at merge. See "Collision classes" below.
4. **Cap the wave.** Default **4** agents. The bottleneck is human PR review, not agent capacity — a wave of 12 just builds a review queue. Go wider only if the user asks.

Present the proposed wave as a numbered list: issue number · title · milestone · one-line scope · why it is compatible with the others. Ask: launch all / drop some / stop.

### Collision classes (KCVV-specific)

Separate worktrees mean agents never fight at run time, but they still collide at merge. Within one wave, allow **at most one** issue that touches each of these:

| Collision class                                                          | Why it collides                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm-lock.yaml` (adds/removes a dep)                                    | The lockfile is prettier-formatted; every agent hand-edits the same 3 blocks. Two = guaranteed conflict.                                                                                                                                                                                                                                                                         |
| Visual-regression baselines                                              | A scoped `-u` run rewrites baseline PNGs. Two agents capturing baselines overwrite each other.                                                                                                                                                                                                                                                                                   |
| `packages/api-contract/src/`                                             | Every downstream app type-checks against it; two concurrent contract changes break each other's build.                                                                                                                                                                                                                                                                           |
| `packages/sanity-schemas/src/`                                           | Shared by both studios; concurrent schema edits conflict.                                                                                                                                                                                                                                                                                                                        |
| Design tokens / `DESIGN.md` / global CSS                                 | Site-wide; two edits to the same token file conflict and both invalidate the whole VR suite.                                                                                                                                                                                                                                                                                     |
| The same route or component file                                         | Check the file list each issue states; two issues editing one file conflict line-for-line.                                                                                                                                                                                                                                                                                       |
| A **rule surface** — a lint rule, a whole-tree guard test, a commit hook | A branch that adds a rule and a branch that adds code can break each other with **no shared file**, so `wave-check.sh`'s merge-tree pass calls the wave clean and main goes red on the combination. #2882 added a guard banning an English `sr-only` announcement, #2880 added one, and they took main down twenty seconds apart. Allow at most one rule-adding branch per wave. |

When in doubt, keep both — but if two issues plausibly land in the same file, serialize them across waves. It is cheaper than a merge fight.

### 2. Draft one self-contained brief per issue

Fill [AFK-BRIEF.md](AFK-BRIEF.md) per issue. The spawned agent does **not** see this conversation, so the brief must stand alone: issue number, worktree path, read-list, acceptance criteria **verbatim**, bootstrap commands, quality gates, commit/PR shape, hard rules.

Show the briefs (collapsed if many). Wait for "launch".

### 3. Spawn the wave in parallel

Open the wave board first — one task per issue, so a running wave is legible at a glance. `Agent()` has no name input: a spawned agent's name is its `subagent_type`, so all four read `kcvv-implementer` and the board is what carries the issue numbers.

```text
TaskCreate({ subject: "#<N> — <short title>",
             activeForm: "#<N> <short title>",
             description: "<the one-line scope from step 1>" })
```

Mark each task `in_progress` as you spawn its agent.

Then, in a **single message**, one `Agent()` call per issue:

```text
Agent({ description: "Issue <N> — <short title>",
        subagent_type: "kcvv-implementer",
        prompt: "<self-contained brief from step 2>" })
```

`kcvv-implementer` (`.claude/agents/kcvv-implementer.md`) pins the model, effort, and turn ceiling for wave work; `general-purpose` would inherit all three from your session instead. If wave agents compact mid-run or their branches come back rough, raise the tier in that file rather than editing this one. PR #2678 has the measurements behind the values.

**Do not pass `isolation: "worktree"`.** The harness worktree does not follow this repo's `../kcvv-issue-<N>` + `feat/issue-<N>` convention and skips the KCVV bootstrap (corepack pnpm, api-contract build, `.env.local`). The brief has the agent create its own worktree the repo way, so `/ralph` and `scripts/ralph.sh` can find and clean up after it.

Flip labels for the whole wave **before** spawning, so `gh issue list --label in-progress` is honest while agents run:

```bash
gh issue edit <N> --remove-label "ready" --add-label "in-progress"
```

### 4. Report back as agents finish

You are notified as each background agent completes. For each:

- Capture the PR URL.
- Note blockers it hit (the brief tells agents to comment-and-stop, never to work around a blocker).
- Mark its board task `completed`, so the board tracks the wave rather than outliving it.

If an agent finished **without** opening a PR, roll its label back so the queue stays truthful:

```bash
gh issue edit <N> --remove-label "in-progress" --add-label "ready"
```

When the wave is done, present a table: issue · PR URL · status (draft / blocked / failed) · what it skipped.

### 5. Review each branch — this part is yours

Wave agents run on a cheaper tier than you do and stop at a **draft** PR, because `/code-review` pins no model of its own: run inside a wave agent it would inherit that agent's tier and grade its own homework. You are the Opus context in this pipeline, so the review sits here.

Per branch, against `../kcvv-issue-<N>`:

1. `/code-review high ../kcvv-issue-<N>`
2. `/simplify ../kcvv-issue-<N>`

Send the confirmed findings back to that issue's agent with `SendMessage` — it still holds the full context of its own change and applies fixes far more cheaply than you can re-derive them. Refute false positives with a one-line reason instead of forwarding them. Apply the fixes in the worktree yourself only when the agent is no longer reachable.

When the fixes land and `check-all` passes again, release the PR:

```bash
gh pr ready <pr-url>
gh issue edit <N> --remove-label "in-progress" --add-label "ready-for-review"
```

`gh pr ready` says the branch has been reviewed. Leave a PR in draft and say so if its findings are unresolved.

This review is the wave's **last gate** (`.claude/CLAUDE.md`) — weigh that when you decide how hard to look and what to wave through as out of scope. Done when every finding on every branch is either applied or refuted in one line, and you can say which is which.

You do control which branch spends CodeRabbitAI's one review an hour: whichever PR you mark ready first wins the race. Order them riskiest-first — the biggest diff, the one touching shared code, the one whose findings you were least sure about.

### 6. Check the merge order before the user merges anything

Every branch in the wave came off the same `origin/main`, so merging one can break the others. Run this and include its output with the table above:

```bash
./scripts/wave-check.sh
```

It is read-only — no checkout, no working-tree change. It reports which branches no longer merge into `main` (rebase those), which pairs collide, and the exact files they fight over. Read the filenames before reacting: a collision in `pnpm-lock.yaml` means the wave broke the collision-class rule in step 1 and one branch just needs the lockfile re-derived; a collision in a route or component is a real design overlap worth a human decision.

Its third section is the one that matters most, because it reports a collision `git merge-tree` structurally cannot see: a branch that adds a **rule** paired with a branch that adds **code the rule will scan**, sharing no file. That pairing is a path heuristic, not a proof — proving it means merging the pair and running the suite, which needs a checkout and an install this script deliberately avoids. So when it names a pair, act on it:

**Whichever of the pair you merge second must be re-checked against the updated `main` before it lands.** Fetch first — a remote-tracking ref left over from before the other branch merged is exactly the stale tree you are trying to test against:

```bash
git fetch origin main
git -C ../kcvv-issue-<N> merge origin/main
```

Then run the check that actually covers the side that changed. `check-all` is not universal:

| Where the change lives                     | What to run                                                                                                                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src`                             | `pnpm --filter @kcvv/web check-all`                                                                                                                                                                      |
| any other `apps/*/src` or `packages/*/src` | `pnpm lint && pnpm type-check && pnpm test && pnpm build` from the repo root — **`check-all` exists only in `apps/web` and `packages/sanity-studio`**, so the web script proves nothing about `apps/api` |
| `.husky/`, `.claude/hooks/`                | `pnpm --filter @kcvv/web test` — `apps/web/test/hooks/` is those scripts' only home and rides that suite                                                                                                 |
| `commitlint.config.js`                     | no automated test covers it; make a deliberately malformed commit in a scratch worktree and confirm it is refused                                                                                        |

Re-running its CI is _not_ enough and neither is `gh run rerun`: a PR's checks are computed against the `main` it forked from, and a rerun replays that same stale merge. Only a fresh push of a branch that actually contains current `main` gives you a real answer.

Tell the user the safe merge order: everything that collides with nothing merges in any order, and each colliding pair gets one merged first, the other rebased after.

### 7. Optional follow-up wave

After the user merges, "again" / "next wave" re-runs from step 0. Newly-unblocked issues become eligible.

## Lifecycle between waves

This skill is **stateless across invocations**. Every run re-queries GitHub, so the dependency graph reflects whatever has been merged since.

- **The orchestrator does not auto-loop.** When the wave's PRs are open, it stops. Downstream issues only unblock once blockers close, which needs merges the orchestrator cannot do.
- **Hands-free continuation** — wrap in `/loop`, e.g. `/loop 45m /ralph-afk`. Each tick re-picks the latest unblocked wave; a tick with nothing eligible reports "no work" and exits. Use 45m+, not 5m — a wave takes far longer than that to produce reviewable PRs.
- **Drained** = `./scripts/unblocked-issues.sh` prints nothing on a zero exit. Say so explicitly, and distinguish it from a nonzero exit, which means the queue could not be read at all.

## Hard rules

Step 1's gate is not a default the user can wave through. These bind even when the user names issues explicitly.

- **Spawn only for an issue carrying `ready` with zero open blockers.** When the user names one that fails either test, say which test it failed — a missing label routes to `/spec`, an open blocker gets named — and stop.
- **One issue per collision class per wave.** The table in step 1 is the list.
- **Every agent works only inside its own `../kcvv-issue-<N>` worktree**, which survives until the human merges. The main checkout is theirs to read, never to write. When a branch guard blocks an agent, the fix is the worktree — `ALLOW_MAIN_COMMIT=1` is a human escape hatch and stays one.
- **A failed or stalled agent goes back to the user, not back into the queue.** They decide whether to re-run it under `/ralph` for closer supervision.
