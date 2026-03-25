#!/bin/bash
# Ralph loop for KCVV — GitHub Issues source, worktree per issue, HITL mode
# Usage:
#   ./scripts/ralph.sh                           # HITL: all ready issues
#   ./scripts/ralph.sh --milestone typed-kv-cache # HITL: one PRD's issues only
#   ./scripts/ralph.sh --issue 742               # single issue only
#   ./scripts/ralph.sh --afk                     # AFK: independent issues only
#   ./scripts/ralph.sh --milestone name --afk    # AFK: one milestone
set -euo pipefail

# Always use personal Claude account — bypasses interactive alias
export CLAUDE_CONFIG_DIR=~/.claude-personal

REPO_ROOT="$(git rev-parse --show-toplevel)"
MODE="hitl"
SPECIFIC_ISSUE=""
MILESTONE=""

for arg in "$@"; do
  case $arg in
    --afk) MODE="afk" ;;
    --issue=*) SPECIFIC_ISSUE="${arg#*=}" ;;
    --issue) shift; SPECIFIC_ISSUE="$1" ;;
    --milestone=*) MILESTONE="${arg#*=}" ;;
    --milestone) shift; MILESTONE="$1" ;;
  esac
done

# ── helpers ──────────────────────────────────────────────────────────────────

pick_next_issue() {
  if [ -n "$SPECIFIC_ISSUE" ]; then
    echo "$SPECIFIC_ISSUE"
    return
  fi

  local args=(--label "ready" --state open --json number --jq 'sort_by(.number) | first | .number')
  if [ -n "$MILESTONE" ]; then
    args+=(--milestone "$MILESTONE")
  fi

  gh issue list "${args[@]}" 2>/dev/null || echo ""
}

count_ready() {
  local args=(--label "ready" --state open --json number --jq 'length')
  if [ -n "$MILESTONE" ]; then
    args+=(--milestone "$MILESTONE")
  fi
  gh issue list "${args[@]}" 2>/dev/null || echo "0"
}

create_worktree() {
  local issue=$1
  local branch="feat/issue-${issue}"
  local path="${REPO_ROOT}/../kcvv-issue-${issue}"

  # Always fetch origin/main first — ensures merged PRs are included
  echo "  [worktree] Fetching origin/main..." >&2
  git fetch origin main >/dev/null 2>&1
  local main_sha
  main_sha=$(git rev-parse origin/main)
  echo "  [worktree] origin/main @ ${main_sha:0:7}" >&2

  if git worktree list | grep -q "$path"; then
    # Worktree exists — check if it predates the latest main
    local worktree_base
    worktree_base=$(git -C "$path" merge-base HEAD origin/main 2>/dev/null || echo "")
    if [ "$worktree_base" != "$main_sha" ]; then
      echo "  [worktree] WARNING: worktree at $path is behind origin/main." >&2
      echo "  Missing merged PRs. Clean up and re-queue with:" >&2
      echo "    git worktree remove $path --force" >&2
      echo "    git branch -d $branch" >&2
      echo "    gh issue edit $issue --remove-label in-progress --add-label ready" >&2
    else
      echo "  [worktree] Existing worktree is up to date." >&2
    fi
  else
    git worktree add "$path" -b "$branch" origin/main >/dev/null 2>&1
    echo "  [worktree] Created at $path on branch $branch" >&2
  fi

  # Only stdout is the path
  echo "$path"
}

remove_worktree() {
  local issue=$1
  local path="${REPO_ROOT}/../kcvv-issue-${issue}"
  local branch="feat/issue-${issue}"
  git worktree remove "$path" --force 2>/dev/null || true
  git branch -d "$branch" 2>/dev/null || true
  echo "Cleaned up worktree for issue #$issue"
}

run_claude_on_issue() {
  local issue=$1
  local worktree=$2

  # Load skill files at runtime — inlined so --print mode gets full content
  local TDD_SKILL=""
  local TDD_PATH="${REPO_ROOT}/.claude/commands/tdd.md"
  if [ -f "$TDD_PATH" ]; then
    TDD_SKILL=$(cat "$TDD_PATH")
  else
    echo "WARNING: tdd.md not found at $TDD_PATH" >&2
  fi

  local STACK_SKILL=""
  local STACK_PATH="${REPO_ROOT}/.claude/skills/kcvv-stack/SKILL.md"
  if [ -f "$STACK_PATH" ]; then
    STACK_SKILL=$(cat "$STACK_PATH")
  fi

  local prompt
  prompt=$(cat <<EOF
You are working on GitHub issue #${issue} for the KCVV Elewijt project.

## Setup
Your working directory is: ${worktree}
All your work happens in this directory. Do NOT touch ${REPO_ROOT} (the main worktree).
The main repo is available read-only at ${REPO_ROOT} for reading CLAUDE.md, docs/prd/, etc.

## Step 1 — Read your brief
  gh issue view ${issue}

Find the PRD path in the issue body (format: "docs/prd/[name].md") and read it:
  cat ${REPO_ROOT}/docs/prd/[name].md

Read the root CLAUDE.md for project-wide rules:
  cat ${REPO_ROOT}/CLAUDE.md

## Step 2 — Implement using TDD
${TDD_SKILL}

## Step 3 — Commit, push, and open a PR when done

IMPORTANT: You are running autonomously. Do NOT ask the user what to do.
Do NOT present options. Do NOT wait for approval. Just do it:

1. Stage and commit all changes with a conventional commit message that includes "Closes #${issue}"
2. Push the branch to origin
3. Create the PR:
  gh pr create \
    --title "[type](scope): description (#${issue})" \
    --body "Closes #${issue}

## What changed
[1-3 bullet summary]

## Testing
- All checks pass: \`pnpm --filter @kcvv/web check-all\`
- [any manual verification steps]"

4. Add the label:
  gh pr edit --add-label "ready-for-review"

Output the PR URL as the last line of your response.

## If blocked mid-implementation
  gh issue edit ${issue} --add-label "blocked" --remove-label "in-progress"
  gh issue create \
    --title "[type](scope): [blocker]" \
    --label "ready" \
    --body "Discovered during #${issue}.\n\n[description]"
  gh issue comment ${issue} --body "Blocked by [reason]. Created #[N] to resolve."

Output on its own line: RALPH_BLOCKED: [one-line reason]

## Stack reference
${STACK_SKILL}
EOF
)

  cd "$worktree"
  OUTPUT=$(command claude --dangerously-skip-permissions --print "$prompt" 2>&1) || true
  cd "$REPO_ROOT"

  echo "$OUTPUT"
}

# ── main loop ─────────────────────────────────────────────────────────────────

MILESTONE_LABEL="${MILESTONE:+ (milestone: $MILESTONE)}"
echo "╔══════════════════════════════════════════╗"
echo "║  Ralph — KCVV GitHub Issues Loop         ║"
echo "║  Mode: $MODE$MILESTONE_LABEL"
echo "╚══════════════════════════════════════════╝"
echo ""

MAX=20
i=0

while [ $i -lt $MAX ]; do
  i=$((i + 1))

  ISSUE=$(pick_next_issue)

  if [ -z "$ISSUE" ] || [ "$ISSUE" = "null" ]; then
    if [ -n "$MILESTONE" ]; then
      echo "✅ No ready issues remain in milestone '$MILESTONE'. Ralph is done."
    else
      echo "✅ No ready issues remain. Ralph is done."
    fi
    exit 0
  fi

  ISSUE_TITLE=$(gh issue view "$ISSUE" --json title --jq '.title')
  ISSUE_MILESTONE=$(gh issue view "$ISSUE" --json milestone --jq '.milestone.title // "none"')
  READY_COUNT=$(count_ready)

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Next issue:  #${ISSUE} — ${ISSUE_TITLE}"
  echo "  Milestone:   ${ISSUE_MILESTONE}"
  echo "  Ready queue: ${READY_COUNT} issue(s)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if [ "$MODE" = "hitl" ]; then
    echo ""
    echo "  View: gh issue view $ISSUE"
    echo ""
    read -r -p "  Proceed with #${ISSUE}? [Y/n/skip/quit] " choice
    case "$choice" in
      n|N) echo "Skipped."; continue ;;
      q|quit|Q) echo "Quit."; exit 0 ;;
      s|skip|S) echo "Skipped."; continue ;;
    esac
  fi

  # Mark in-progress
  gh issue edit "$ISSUE" --add-label "in-progress" --remove-label "ready" 2>/dev/null || true

  # Create worktree
  WORKTREE=$(create_worktree "$ISSUE")
  echo "  Worktree: $WORKTREE"
  echo ""

  # Run Claude
  OUTPUT=$(run_claude_on_issue "$ISSUE" "$WORKTREE")
  echo "$OUTPUT"
  echo ""

  # Check outcome
  if echo "$OUTPUT" | grep -q "RALPH_BLOCKED"; then
    echo "⚠️  Issue #${ISSUE} is blocked. Moving on."
    remove_worktree "$ISSUE"
    if [ "$MODE" = "hitl" ]; then
      read -r -p "  Continue to next issue? [Y/n] " choice
      [[ "$choice" =~ ^[nN] ]] && exit 0
    fi
    continue
  fi

  # PR opened
  PR_URL=$(echo "$OUTPUT" | grep -o "https://github.com[^ ]*pull[^ ]*" | tail -1)
  echo "✅ Issue #${ISSUE} complete. PR opened."
  if [ -n "$PR_URL" ]; then
    echo "   $PR_URL"
  fi
  echo ""

  # Unblock dependent issues (only if ALL blockers are resolved)
  CANDIDATES=$(gh issue list \
    --label "blocked" \
    --state open \
    --json number,body \
    --jq ".[] | select(.body | contains(\"#${ISSUE}\")) | .number" 2>/dev/null || echo "")

  if [ -n "$CANDIDATES" ]; then
    for CANDIDATE_NUM in $CANDIDATES; do
      # Extract all issue numbers from the "Blocked by" section to end of body
      BODY=$(gh issue view "$CANDIDATE_NUM" --json body --jq '.body' 2>/dev/null || echo "")
      BLOCKERS=$(echo "$BODY" | sed -n '/[Bb]locked [Bb]y/,$p' | grep -o '#[0-9]\+' | tr -d '#' || echo "")

      if [ -z "$BLOCKERS" ]; then
        # No structured "Blocked by" found — skip to be safe
        echo "  ⚠️  #${CANDIDATE_NUM} mentions #${ISSUE} but has no 'Blocked by' list — skipping"
        continue
      fi

      ALL_RESOLVED=true
      STILL_OPEN=""
      for BLOCKER in $BLOCKERS; do
        if [ "$BLOCKER" = "$ISSUE" ]; then
          continue  # This one is being completed now
        fi
        BLOCKER_STATE=$(gh issue view "$BLOCKER" --json state --jq '.state' 2>/dev/null || echo "OPEN")
        if [ "$BLOCKER_STATE" != "CLOSED" ]; then
          ALL_RESOLVED=false
          STILL_OPEN="${STILL_OPEN} #${BLOCKER}"
        fi
      done

      if [ "$ALL_RESOLVED" = true ]; then
        gh issue edit "$CANDIDATE_NUM" --remove-label "blocked" --add-label "ready" 2>/dev/null || true
        gh issue comment "$CANDIDATE_NUM" \
          --body "All blockers resolved (last: #${ISSUE}). Ready to pick up." 2>/dev/null || true
        echo "  Unblocked: #${CANDIDATE_NUM}"
      else
        gh issue comment "$CANDIDATE_NUM" \
          --body "#${ISSUE} resolved. Still blocked by:${STILL_OPEN}" 2>/dev/null || true
        echo "  #${CANDIDATE_NUM} still blocked by:${STILL_OPEN}"
      fi
    done
    echo ""
  fi

  # Single-issue mode exits here
  if [ -n "$SPECIFIC_ISSUE" ]; then
    echo "Single-issue mode complete."
    exit 0
  fi

  # CodeRabbit / PR review gate — always pause here
  echo "  PR review gate:"
  if [ -n "$PR_URL" ]; then
    echo "    $PR_URL"
  fi
  echo "  Wait for CodeRabbit (1-2 min), review, then merge before continuing."
  echo "  To apply feedback: cd ../kcvv-issue-${ISSUE} && claude"
  echo ""
  read -r -p "  PR reviewed, merged, and ready for next? [Y/n] " pr_choice
  if [[ "$pr_choice" =~ ^[nN] ]]; then
    echo "  Paused. Re-run ./scripts/ralph.sh --milestone ${ISSUE_MILESTONE} when ready."
    exit 0
  fi

  # HITL pause between issues
  if [ "$MODE" = "hitl" ]; then
    READY_COUNT=$(count_ready)
    echo "  Ready queue now: ${READY_COUNT} issue(s)"
    echo ""
    read -r -p "  Continue to next issue? [Y/n] " choice
    [[ "$choice" =~ ^[nN] ]] && exit 0
  fi

done

echo "Ralph reached max iterations ($MAX). Stopping."
