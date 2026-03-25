# Spec — Make Issues Ready for Ralph

Refine underspecified issues until they're implementation-ready. Human-in-the-loop: review and approve before labeling `ready`.

## How Spec Works

1. Find open issues that are **not labeled `ready`** (regardless of blocking status)
2. Evaluate each for specification completeness
3. Refine underspecified ones via conversation with the user
4. Label `ready` when the issue is 200% clear

## Starting Spec

```
/spec
```

Or target a specific issue or milestone:

```
/spec 742
/spec --milestone sponsors-redesign
```

## Step 1 — Find Candidates

Fetch open issues that are NOT labeled `ready`, `in-progress`, or `ready-for-review`:

```bash
# Get all open issues without the ready label
gh issue list --state open --json number,title,labels,milestone \
  --jq '[.[] | select(.labels | map(.name) | (contains(["ready"]) or contains(["in-progress"]) or contains(["ready-for-review"])) | not)] | sort_by(.number) | .[] | "\(.number)\t\(.title)\t\(.milestone.title // "none")"'
```

Present all unready candidates to the user. Note which ones are blocked (for context), but do NOT skip them — an issue can be spec'd while still blocked.

**Wait for approval on which issue to spec.**

## Step 2 — Evaluate the Issue

Read the issue body:

```bash
gh issue view $ISSUE_NUM
```

Check against the readiness checklist:

- [ ] **Context**: Is it clear WHY this issue exists?
- [ ] **Acceptance criteria**: Are there concrete, testable conditions? (not vague "implement X")
- [ ] **Scope**: Which packages/apps are touched?
- [ ] **PRD link**: If part of a milestone, does it reference the PRD and phase?
- [ ] **No open questions**: Are all questions resolved?
- [ ] **Dependencies clear**: Are blockedBy relationships set for anything that needs to be done first?

If ALL boxes check out → skip to Step 4.

## Step 3 — Refine

For each gap found in Step 2, engage the user:

1. **Read the PRD** (if linked) for additional context
2. **Ask specific questions** — not "is this clear?" but "should the API return paginated results or all at once?"
3. **Propose concrete acceptance criteria** based on the PRD, codebase patterns, and conversation
4. **Update the issue body** with the refined spec:

```bash
gh issue edit $ISSUE_NUM --body "$(cat <<'EOF'
## Context

[refined context]

**PRD:** docs/prd/[name].md — Phase [N]
**Milestone:** [milestone]

## Acceptance criteria

- [ ] [concrete testable condition]
- [ ] [concrete testable condition]
- [ ] `pnpm --filter @kcvv/web check-all` passes

## Scope

**Packages:** [apps/web | apps/api | packages/api-contract | apps/studio]
EOF
)"
```

## Step 4 — Label Ready

Once the issue is fully specified and the user approves:

```bash
gh issue edit $ISSUE_NUM --add-label "ready"
gh issue comment $ISSUE_NUM --body "Spec complete. Ready for implementation."
```

## Step 5 — Next Candidate

Propose the next unready, unblocked issue. Repeat from Step 1.

## Rules

- Never label `ready` without user approval
- Never modify acceptance criteria without showing the user what changed
- `ready` means "specs are clear" — it's independent of blocking status. A blocked issue CAN be `ready`.
- If an issue is a wishlist item with no clear scope, tell the user — don't force-spec it
- Tracer bullet issues should be spec'd first within a milestone (they inform later phases)
