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
- Issues with unresolved open questions get labeled `blocked`, not `ready`
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
URL=$(gh issue create \
  --title "[type](scope): [description]" \
  --label "ready" \
  --milestone "$MILESTONE_TITLE" \
  --body "[body from template]" \
  --json url --jq '.url')

# Add to GitHub Project board
gh project item-add 2 --owner soniCaH --url "$URL"
```

For blocked issues use `--label "blocked"` instead of `--label "ready"`.

## Step 4 — Wire dependencies

Add `blocked-by` comments to dependent issues:

```bash
gh issue comment <blocked-issue> --body "Blocked by #<dependency>"
```

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
