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

Check for blocking relationships before ranking. An issue with unresolved blockers should not be picked up:

```bash
# For each candidate, check if it has open blockers via GraphQL
gh api graphql -f query='
  query {
    repository(owner: "soniCaH", name: "www.kcvvelewijt.be") {
      issue(number: '"${CANDIDATE}"') {
        blockedBy(first: 50) { nodes { number state } }
      }
    }
  }' --jq '[.data.repository.issue.blockedBy.nodes[] | select(.state == "OPEN")] | length'
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

## Step 5.5 — Code Review (Pre-PR)

After quality checks pass, spawn the `superpowers:code-reviewer` agent to review all changes before pushing. This catches issues that would otherwise be flagged by CodeRabbitAI.

Use the Agent tool with `subagent_type: "superpowers:code-reviewer"` and provide:

- The issue number and PRD context
- The diff of all changes (`git diff origin/main...HEAD`)
- Instruction to review against CLAUDE.md coding standards

Fix any issues the reviewer identifies, then re-run the quality gate before proceeding to Step 6.

Do not skip this step — it exists to reduce PR review round-trips.

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

When an issue is blocked by another issue, set the relationship via the GraphQL `addBlockedBy` mutation so `ralph.sh` can automatically unblock it later:

```bash
# 1. Get node_ids for both issues
BLOCKER_NUM=<blocking-issue-number>
ISSUE_NODE_ID=$(gh api "/repos/{owner}/{repo}/issues/${ISSUE_NUM}" --jq '.node_id')
BLOCKER_NODE_ID=$(gh api "/repos/{owner}/{repo}/issues/${BLOCKER_NUM}" --jq '.node_id')

# 2. Set the blockedBy relationship
gh api graphql -f query="
  mutation {
    addBlockedBy(input: {
      issueId: \"${ISSUE_NODE_ID}\",
      blockingIssueId: \"${BLOCKER_NODE_ID}\"
    }) { issue { number } }
  }"

# 3. Keep the ready label (specs are still clear — blockedBy is the gate)

# 4. Comment with context
gh issue comment $ISSUE_NUM --body "Blocked by #${BLOCKER_NUM}. Blocking relationship set via API."
```

When checking if an issue is still blocked, query its blockedBy relationships:

```bash
# List blockers and their state
gh api graphql -f query='
  query {
    repository(owner: "soniCaH", name: "www.kcvvelewijt.be") {
      issue(number: '"${ISSUE_NUM}"') {
        blockedBy(first: 50) { nodes { number state } }
      }
    }
  }' --jq '.data.repository.issue.blockedBy.nodes[] | "\(.number) \(.state)"'
```

An issue is unblocked when all its blockers are in `CLOSED` state. Ralph automatically picks it up on the next iteration if it also has the `ready` label — no label changes needed.

## Labels Convention

| Label              | Meaning                                                |
| ------------------ | ------------------------------------------------------ |
| `ready`            | Specs are 200% clear — Ralph can work on this          |
| `in-progress`      | Worktree active                                        |
| `ready-for-review` | PR open, awaiting human review                         |
| _(no label)_       | Not yet specified — needs `/spec` before Ralph can use |

**Blocking** is tracked via GitHub's native `blockedBy` relationships, not labels.
An issue can be `ready` (well-specified) AND blocked — Ralph checks both:

1. Has `ready` label? (specs are clear)
2. Has no open blockers? (via GraphQL `blockedBy` query)

Both must be true for Ralph to pick it up. Use `/spec` to refine underspecified issues.

## Rules

- Never start a second issue before the current PR is open
- Never commit directly to main
- Never skip the quality gate
- If blocked, set the blockedBy relationship via GraphQL (see "If Blocked" above) and propose the next issue
