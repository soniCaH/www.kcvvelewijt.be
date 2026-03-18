#!/bin/bash
# Ralph loop for KCVV — GitHub Issues source, worktree per issue, HITL mode
# Usage:
#   ./scripts/ralph.sh              # HITL: pauses between issues for approval
#   ./scripts/ralph.sh --afk        # AFK: runs until no ready issues remain
#   ./scripts/ralph.sh --issue 742  # Run a specific issue only
set -euo pipefail

# Always use personal Claude account for this project.
# Bypasses the interactive alias so --print mode works non-interactively.
export CLAUDE_CONFIG_DIR=~/.claude-personal

REPO_ROOT="$(git rev-parse --show-toplevel)"
MODE="hitl"
SPECIFIC_ISSUE=""

for arg in "$@"; do
  case $arg in
    --afk) MODE="afk" ;;
    --issue) shift; SPECIFIC_ISSUE="$1" ;;
    --issue=*) SPECIFIC_ISSUE="${arg#*=}" ;;
  esac
done

# ── helpers ──────────────────────────────────────────────────────────────────

pick_next_issue() {
  if [ -n "$SPECIFIC_ISSUE" ]; then
    echo "$SPECIFIC_ISSUE"
    return
  fi
  # Tracer-bullet issues first, then ready issues by issue number (oldest first)
  gh issue list \
    --label "ready" \
    --state open \
    --json number,title,labels \
    --jq 'sort_by(.number) | 
          (map(select(.labels[].name == "tracer-bullet")) + 
           map(select(.labels[].name != "tracer-bullet"))) | 
          first | .number' 2>/dev/null || echo ""
}

count_ready() {
  gh issue list --label "ready" --state open --json number --jq 'length' 2>/dev/null || echo "0"
}

create_worktree() {
  local issue=$1
  local branch="feat/issue-${issue}"
  local path="${REPO_ROOT}/../kcvv-issue-${issue}"

  if git worktree list | grep -q "$path"; then
    echo "  [worktree] Already exists at $path" >&2
  else
    git fetch origin --quiet 2>/dev/null
    git worktree add "$path" -b "$branch" origin/main 2>/dev/null
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

  # Load skill files at runtime so Claude gets the full content, not just a path reference.
  # This is required because --print mode doesn't support slash commands.
  local TDD_SKILL=""
  local TDD_PATH="${REPO_ROOT}/.claude/commands/tdd.md"
  if [ -f "$TDD_PATH" ]; then
    TDD_SKILL=$(cat "$TDD_PATH")
  else
    echo "WARNING: tdd.md not found at $TDD_PATH — TDD instructions will be missing" >&2
  fi

  local STACK_SKILL=""
  local STACK_PATH="${REPO_ROOT}/.claude/skills/kcvv-stack/SKILL.md"
  if [ -f "$STACK_PATH" ]; then
    STACK_SKILL=$(cat "$STACK_PATH")
  fi

  # Build the prompt with inlined skill content
  local prompt
  prompt=$(cat <<EOF
You are working on GitHub issue #${issue} for the KCVV Elewijt project.

## Setup
Your working directory is: ${worktree}
All your work happens in this directory. Do NOT touch ${REPO_ROOT} (the main worktree).
The main repo is available read-only at ${REPO_ROOT} for reading CLAUDE.md, docs/prd/, etc.

## Step 1 — Read your brief
Run these before touching any code:
  gh issue view ${issue}

Find the PRD path in the issue body (format: "docs/prd/[name].md") and read it:
  cat ${REPO_ROOT}/docs/prd/[name].md

Read the root CLAUDE.md for project-wide rules:
  cat ${REPO_ROOT}/CLAUDE.md

## Step 2 — Implement using TDD
Follow this process exactly:

${TDD_SKILL}

## Step 3 — Open a PR when done
  gh pr create \
    --title "[type](scope): description (#${issue})" \
    --body "Closes #${issue}

## What changed
[1-3 bullet summary]

## Testing
- All checks pass: \`pnpm --filter @kcvv/web check-all\`
- [any manual verification steps]"

  gh pr edit --add-label "ready-for-review"

Output the PR URL as the last line of your response.

## If you get blocked mid-implementation
  gh issue edit ${issue} --add-label "blocked" --remove-label "in-progress"
  gh issue create --title "[type](scope): [blocker description]" --label "ready" --body "Discovered during #${issue}.\n\n[description]"
  gh issue comment ${issue} --body "Blocked by [reason]. Created #[new] to resolve."

Then output on its own line: RALPH_BLOCKED: [one-line reason]

## Stack reference
${STACK_SKILL}
EOF
)

  # Run Claude non-interactively in the worktree
  cd "$worktree"
  OUTPUT=$(claude --dangerously-skip-permissions --print "$prompt" 2>&1) || true
  cd "$REPO_ROOT"

  echo "$OUTPUT"
}

# ── main loop ─────────────────────────────────────────────────────────────────

echo "╔══════════════════════════════════════════╗"
echo "║  Ralph — KCVV GitHub Issues Loop         ║"
echo "║  Mode: $MODE"
echo "╚══════════════════════════════════════════╝"
echo ""

MAX=20
i=0

while [ $i -lt $MAX ]; do
  i=$((i + 1))

  # ── pick issue ──
  ISSUE=$(pick_next_issue)

  if [ -z "$ISSUE" ]; then
    echo "✅ No ready issues remain. Ralph is done."
    exit 0
  fi

  ISSUE_TITLE=$(gh issue view "$ISSUE" --json title --jq '.title')
  READY_COUNT=$(count_ready)

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Next issue: #${ISSUE} — ${ISSUE_TITLE}"
  echo "  Ready queue: ${READY_COUNT} issue(s)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # ── HITL approval ──
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

  # ── mark in-progress ──
  gh issue edit "$ISSUE" --add-label "in-progress" --remove-label "ready" 2>/dev/null || true

  # ── create worktree ──
  WORKTREE=$(create_worktree "$ISSUE")
  echo "  Worktree: $WORKTREE"
  echo ""

  # ── run claude ──
  OUTPUT=$(run_claude_on_issue "$ISSUE" "$WORKTREE")
  echo "$OUTPUT"
  echo ""

  # ── check outcome ──
  if echo "$OUTPUT" | grep -q "RALPH_BLOCKED"; then
    echo "⚠️  Issue #${ISSUE} is blocked. Moving on."
    remove_worktree "$ISSUE"

    if [ "$MODE" = "hitl" ]; then
      read -r -p "  Continue to next issue? [Y/n] " choice
      [[ "$choice" =~ ^[nN] ]] && exit 0
    fi
    continue
  fi

  # ── PR opened — check for unblocked issues ──
  echo "✅ Issue #${ISSUE} complete. PR opened."
  echo ""

  # Unblock any issues that were waiting on this one
  UNBLOCKED=$(gh issue list \
    --label "blocked" \
    --state open \
    --json number,body \
    --jq ".[] | select(.body | contains(\"#${ISSUE}\")) | .number" 2>/dev/null || echo "")

  if [ -n "$UNBLOCKED" ]; then
    for UNBLOCK_NUM in $UNBLOCKED; do
      gh issue edit "$UNBLOCK_NUM" --remove-label "blocked" --add-label "ready" 2>/dev/null || true
      gh issue comment "$UNBLOCK_NUM" \
        --body "Unblocked: #${ISSUE} has been completed. This issue is now ready." 2>/dev/null || true
      echo "  Unblocked: #${UNBLOCK_NUM}"
    done
    echo ""
  fi

  # Single-issue mode
  if [ -n "$SPECIFIC_ISSUE" ]; then
    echo "Single-issue mode complete."
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
