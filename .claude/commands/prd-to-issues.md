# PRD to GitHub Issues

Convert the PRD at `docs/prd/[feature-name].md` into GitHub Issues and wire them together.

## Important

Do NOT run git commit or git push. After creating issues, tell the user
what to commit and they will do it manually.

## Rules for decomposition

- One issue = one worktree = one PR. If it touches 5 files across 3 apps, split it.
- The tracer bullet from the PRD is ALWAYS issue #1 in the set — labeled `tracer-bullet` + `ready`.
- Issues with unresolved open questions get labeled `blocked`, not `ready`.
- Every issue body must include its PRD phase so Ralph can find its spec.

## Issue body template

```markdown
## Context

[Why this issue exists — one paragraph linking back to the PRD phase]

**PRD:** docs/prd/[feature-name].md — Phase [N]

## Tracer bullet / Acceptance criteria

- [ ] [concrete testable condition]
- [ ] [concrete testable condition]
- [ ] `pnpm --filter @kcvv/web check-all` passes

## Scope

**Packages:** [apps/web | apps/api | packages/api-contract | apps/studio]
**Worktree path:** `../kcvv-issue-<N>`

## Open questions

[Copy any unresolved open questions from the PRD that affect THIS issue]
[If none: "None — ready to implement"]

## Blocked by

[#issue or "nothing"]
```

## Creating issues

For each phase in the PRD:

```bash
# Create issue
URL=$(gh issue create \
  --title "[type](scope): [description]" \
  --label "ready" \
  --body "[body from template]" \
  --json url --jq '.url')

# Add to GitHub Project board (project #2, owner soniCaH)
gh project item-add 2 --owner soniCaH --url "$URL"
```

For blocked issues, use `--label "blocked"` instead of `--label "ready"`.

## After all issues are created

1. Print the full issue list with numbers, titles, and labels.
2. Add `blocked-by: #N` comments to issues that depend on others:

```bash
gh issue comment <blocked-issue> --body "Blocked by #<dependency>"
```

3. Update the PRD file to include issue numbers next to each phase:

```bash
# Edit docs/prd/[feature-name].md to add:
# Phase 1: tracer bullet → #742
# Phase 2: ... → #743
# etc.
git add docs/prd/[feature-name].md
git commit -m "docs: link prd phases to github issues"
```

## Unblocking flow

When a blocking issue is merged:

```bash
# Remove blocked label, add ready
gh issue edit <blocked-issue> --remove-label "blocked" --add-label "ready"
gh issue comment <blocked-issue> --body "Unblocked by merge of #<dependency>. Ready to pick up."
```

Ralph's `scripts/ralph.sh` checks for `ready` label — it will automatically pick up newly unblocked issues on the next iteration.
