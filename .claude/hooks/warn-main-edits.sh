#!/bin/bash
# Block file edits on main/master branch.
set -euo pipefail

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: Editing files on main. Use /ralph to pick an issue and create a worktree first."}}
EOF
  exit 0
fi

exit 0
