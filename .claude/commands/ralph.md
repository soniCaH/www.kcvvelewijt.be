# Ralph — GitHub Issues Loop

Autonomous issue-driven development loop. Human-in-the-loop mode: propose before acting.

## How Ralph Works

1. Fetch open issues labeled `ready` (or as specified)
2. Propose the next issue to work on — wait for approval
3. Create a git worktree for that issue
4. Implement using /tdd
5. Run quality checks
6. Open a PR and link to the issue
7. Propose the next issue — repeat

## Starting Ralph

```
/ralph
```

Or target a specific label or issue:

```
/ralph --label sprint-1
/ralph --issue 742
```

## Step 1 — Propose Next Issue

Fetch the backlog and propose:

```bash
gh issue list --label ready --state open --json number,title,labels,body \
  --jq '.[] | "\(.number): \(.title)"' | head -10
```

Check for blocking relationships before ranking. An issue with unresolved sub-issues (blockers) should not be picked up:

```bash
# For each candidate, check if it has open sub-issues (blockers)
gh api "/repos/{owner}/{repo}/issues/${CANDIDATE}/sub_issues" \
  --jq '[.[] | select(.state != "closed")] | length'
# 0 = no open blockers → safe to pick up
```

Present the top candidates ranked by: dependencies resolved → smallest scope → label priority.

**Wait for human approval before proceeding.**

## Step 2 — Create Worktree

```bash
ISSUE_NUM=<approved-issue>
BRANCH="feat/issue-${ISSUE_NUM}"
WORKTREE_PATH="../kcvv-issue-${ISSUE_NUM}"

git fetch origin
git worktree add "$WORKTREE_PATH" -b "$BRANCH" origin/main
cd "$WORKTREE_PATH"
pnpm install
```

Comment on the issue:

```bash
gh issue comment $ISSUE_NUM --body "Starting implementation on branch \`${BRANCH}\`. Worktree: \`${WORKTREE_PATH}\`"
```

## Step 3 — Read & Understand

Read the issue body and linked PRD (if any). If the issue is underspecified, run `/grill-me` before touching code. Do not start implementing until there is a shared understanding.

```bash
gh issue view $ISSUE_NUM
```

## Step 4 — Implement with TDD

Follow `/tdd`. Work in the worktree. Commit frequently with conventional commits referencing the issue:

```
feat(scope): implement X

Closes #<issue-number>
```

## Step 5 — Quality Gate

```bash
pnpm --filter @kcvv/web check-all
# If api-contract changed:
pnpm turbo build --filter=@kcvv/web
```

Do not proceed to PR if any check fails.

## Step 6 — Commit, Push, and Open PR

Do NOT ask the user what to do. Do NOT present options or wait for approval.
Ralph is autonomous — commit, push, and create the PR directly:

1. Stage and commit all changes with a conventional commit including "Closes #ISSUE_NUM"
2. Push the branch to origin
3. Create the PR:

```bash
gh pr create \
  --title "feat(scope): description (#${ISSUE_NUM})" \
  --body "Closes #${ISSUE_NUM}\n\n## Changes\n\n- ...\n\n## Testing\n\n- All checks pass\n- Manual test: ..." \
  --label "ready-for-review"
```

**Wait for human review before merging.** (Ralph handles this — not you.)

## Step 7 — Propose Next

After PR is open, go back to Step 1 and propose the next issue.

## Worktree Cleanup (after PR merge)

```bash
git worktree remove "../kcvv-issue-${ISSUE_NUM}" --force
git branch -d "$BRANCH"
```

## If Blocked

When an issue is blocked by another issue, set the relationship via the Sub-issues API so `ralph.sh` can automatically unblock it later:

```bash
# 1. Get the node_id of the blocking issue
BLOCKER_NUM=<blocking-issue-number>
BLOCKER_NODE_ID=$(gh api "/repos/{owner}/{repo}/issues/${BLOCKER_NUM}" --jq '.node_id')

# 2. Add the blocking issue as a sub-issue of the blocked issue
gh api "/repos/{owner}/{repo}/issues/${ISSUE_NUM}/sub_issues" \
  --method POST \
  -f sub_issue_id="$BLOCKER_NODE_ID"

# 3. Label the blocked issue
gh issue edit $ISSUE_NUM --add-label "blocked" --remove-label "ready"

# 4. Comment with context
gh issue comment $ISSUE_NUM --body "Blocked by #${BLOCKER_NUM}. Sub-issue relationship set via API."
```

When checking if an issue is still blocked, query its sub-issues:

```bash
# List sub-issues (blockers) and their state
gh api "/repos/{owner}/{repo}/issues/${ISSUE_NUM}/sub_issues" \
  --jq '.[] | "\(.number) \(.state)"'
```

An issue is unblocked when all its sub-issues are in `closed` state. The automated `ralph.sh` script handles unblocking automatically after each PR merge.

## Labels Convention

| Label              | Meaning                           |
| ------------------ | --------------------------------- |
| `ready`            | Fully specified, can be picked up |
| `in-progress`      | Worktree active                   |
| `blocked`          | Waiting on dependency or decision |
| `ready-for-review` | PR open, awaiting human review    |

## Rules

- Never start a second issue before the current PR is open
- Never commit directly to main
- Never skip the quality gate
- If blocked, set the sub-issue relationship via API (see "If Blocked" above) and propose the next issue
