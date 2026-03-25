# PRD to GitHub Issues

Convert the PRD at `docs/prd/[feature-name].md` into GitHub Issues, a milestone, and wire them together.

## Before starting

Verify the current branch is main: `git branch --show-current`
If not on main, stop and tell the user to run `git checkout main` first.

## Step 1 — Create a milestone for this PRD

Every PRD gets its own milestone. This isolates it from other concurrent PRDs so Ralph can work on them independently in parallel.

```bash
MILESTONE_TITLE="[feature-name]"  # e.g. typed-kv-cache, footbalisto-domain-service

gh api repos/soniCaH/www.kcvvelewijt.be/milestones \
  --method POST \
  --field title="$MILESTONE_TITLE" \
  --field description="docs/prd/${MILESTONE_TITLE}.md"
```

## Step 2 — Decompose into issues

Rules:

- One issue = one worktree = one PR
- The tracer bullet from the PRD is ALWAYS issue #1 — labeled `tracer-bullet` + `ready`
- ALL well-specified issues get the `ready` label — even blocked ones (`ready` = specs are clear; blocking is tracked separately via GitHub blockedBy relationships)
- Every issue body must reference its PRD phase and milestone

## Issue body template

```markdown
## Context

[Why this issue exists — one paragraph linking back to the PRD phase]

**PRD:** docs/prd/[feature-name].md — Phase [N]
**Milestone:** [milestone-title]

## Acceptance criteria

- [ ] [concrete testable condition]
- [ ] [concrete testable condition]
- [ ] `pnpm --filter @kcvv/web check-all` passes

## Scope

**Packages:** [apps/web | apps/api | packages/api-contract | apps/studio]

## Open questions

[Any unresolved questions from the PRD that affect this issue]
[If none: "None — ready to implement"]

## Blocked by

[#issue or "nothing"]
```

## Step 3 — Create issues and assign to milestone

```bash
# Create each issue and assign to the milestone in one step
gh issue create \
  --title "[type](scope): [description]" \
  --label "ready" \
  --milestone "$MILESTONE_TITLE" \
  --body "[body from template]"
```

ALL well-specified issues get the `ready` label, even blocked ones. `ready` means "specs are clear" — blocking is a separate concern tracked via GitHub's blockedBy relationships. Ralph checks both before picking up an issue.

## Step 4 — Wire dependencies via GraphQL blockedBy API

For each issue that has a `## Blocked by` section listing other issues, create a blocking relationship via the GraphQL API. This makes dependencies machine-readable and visible in the GitHub UI.

```bash
# For each blocked issue, set up blockedBy relationships:

# 1. Get node_ids for both issues
BLOCKED_NODE_ID=$(gh api /repos/{owner}/{repo}/issues/<blocked-number> --jq '.node_id')
BLOCKER_NODE_ID=$(gh api /repos/{owner}/{repo}/issues/<blocker-number> --jq '.node_id')

# 2. Set the blockedBy relationship
gh api graphql -f query="
  mutation {
    addBlockedBy(input: {
      issueId: \"${BLOCKED_NODE_ID}\",
      blockingIssueId: \"${BLOCKER_NODE_ID}\"
    }) { issue { number } }
  }"
```

Repeat for every blocker listed in the `## Blocked by` section.

If the API call fails, log a warning and continue — the `## Blocked by` markdown in the body still serves as a fallback.

**Note:** The `## Blocked by` markdown is still written in issue bodies for human readability (transitional). Both the API relationship and the markdown must be present.

## Step 5 — Update the PRD with issue numbers

Edit `docs/prd/[feature-name].md` to add issue numbers next to each phase, then tell the user:

```
PRD is ready. Do NOT commit yet — tell the user to run:
  git add docs/prd/[feature-name].md
  git commit -m "docs: link [feature-name] prd phases to github issues"
  git push
```

## Step 6 — Show the summary

Print a table of all created issues with numbers, titles, labels, and milestone.
Then tell the user:

```
Run Ralph for this milestone:
  ./scripts/ralph.sh --milestone [milestone-title]
```

## Unblocking flow (for Claude running inside a worktree)

When a blocking issue is merged, Ralph handles unblocking automatically.
If doing it manually:

```bash
gh issue edit <blocked-issue> --remove-label "blocked" --add-label "ready"
gh issue comment <blocked-issue> --body "Unblocked by merge of #<dependency>."
```
